import KeycloakAdminClient, { NetworkError } from '@keycloak/keycloak-admin-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerError, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { identityServiceUnavailable, LoginNameTaken } from '~/domain/login/login-errors';
import { CreateLoginParams, LoginStore } from '~/domain/login/LoginStore';
import { EnvironmentVariables } from '~/infrastructure/configuration/env.validation';

// How long a call to Keycloak is waited for. One that does not answer, such
// as one to a Keycloak that has stopped responding, is given up on after
// this, so that a request waits seconds and not for ever.
const callTimeoutMilliseconds = 5000;

// Keycloak answers a name another Login holds with this status.
const conflict = 409;

// Whether Keycloak could not be reached: the call could not be made, it was
// given up on, or Keycloak answered that it cannot serve now. Any other answer
// means that Keycloak refused the call, which is the API's fault.
function isUnreachable(error: unknown): boolean {
  if (!(error instanceof NetworkError)) return true;
  return error.response.status >= 500;
}

function failureOf(error: unknown, message: string): StructuredError {
  return isUnreachable(error)
    ? identityServiceUnavailable(message)
    : ServerError.of(message);
}

// The realm's Logins, kept by Keycloak and changed through its administration
// interface as the service account of the API's own client. This is the only
// code that imports Keycloak's admin client.
@Injectable()
export class KeycloakLoginStore implements LoginStore {
  private readonly logger = new Logger(KeycloakLoginStore.name);

  constructor(private readonly settings: ConfigService<EnvironmentVariables, true>) {}

  async create(params: CreateLoginParams): Promise<Either.Either<string, StructuredError>> {
    let administration: KeycloakAdminClient;
    let loginId: string;
    try {
      administration = await this.logIn();
      ({ id: loginId } = await administration.users.create({
        username: params.getName(),
        enabled: true,
        // A temporary password makes Keycloak require the Login to replace it
        // at its next login. The required action is not added again here, so
        // that a password given as a lasting one could not pass for one.
        credentials: [
          { type: 'password', value: params.getTemporaryPassword(), temporary: true },
        ],
      }));
    } catch (error) {
      if (error instanceof NetworkError && error.response.status === conflict) {
        return Either.left(LoginNameTaken.of(params.getName()));
      }
      this.logger.error(error, 'A Login could not be made');
      return Either.left(failureOf(error, 'A Login could not be made'));
    }

    try {
      // The roles a Login may still be given. Reading a role by its name
      // would need a wider role of the realm's administration than the API's
      // client holds.
      const assignable = await administration.users.listAvailableRealmRoleMappings({
        id: loginId,
      });
      const role = assignable.find((each) => each.name === params.getRole().getRoleName());
      if (role?.id === undefined || role.name === undefined) {
        throw new Error(`The realm has no role ${params.getRole().getRoleName()} to give`);
      }
      await administration.users.addRealmRoleMappings({
        id: loginId,
        roles: [{ id: role.id, name: role.name }],
      });
    } catch (error) {
      this.logger.error(error, `The Login ${loginId} could not be given its role`);
      // A Login without its role is no use to anyone, and would hold the name.
      const deleted = await this.delete(loginId);
      if (Either.isLeft(deleted)) return Either.left(deleted.left);
      return Either.left(failureOf(error, 'A Login could not be given its role'));
    }

    return Either.right(loginId);
  }

  async delete(loginId: string): Promise<Either.Either<void, StructuredError>> {
    try {
      const administration = await this.logIn();
      await administration.users.del({ id: loginId });
      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, `The Login ${loginId} could not be deleted`);
      return Either.left(failureOf(error, `The Login ${loginId} could not be deleted`));
    }
  }

  // Logs in as the API's client, for one use of the administration interface.
  // Nothing is kept between uses, so the API connects to Keycloak only when a
  // call needs it.
  private async logIn(): Promise<KeycloakAdminClient> {
    const administration = new KeycloakAdminClient({
      baseUrl: this.settings.get('KEYCLOAK_URL', { infer: true }),
      realmName: this.settings.get('KEYCLOAK_REALM', { infer: true }),
      timeout: callTimeoutMilliseconds,
    });
    await administration.auth({
      grantType: 'client_credentials',
      clientId: this.settings.get('KEYCLOAK_CLIENT_ID', { infer: true }),
      clientSecret: this.settings.get('KEYCLOAK_CLIENT_SECRET', { infer: true }),
    });
    return administration;
  }
}
