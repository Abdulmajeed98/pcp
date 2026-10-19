import KeycloakAdminClient, { NetworkError } from '@keycloak/keycloak-admin-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, ServerError, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { identityServiceUnavailable, loginNameTaken } from '~/domain/login/login-errors';
import {
  CreateLoginParams,
  LoginStore,
  RenameLoginParams,
  SetTemporaryPasswordParams,
} from '~/domain/login/LoginStore';
import { EnvironmentVariables } from '~/infrastructure/configuration/env.validation';

// How long a call to Keycloak is waited for. One that does not answer, such
// as one to a Keycloak that has stopped responding, is given up on after
// this, so that a request waits seconds and not for ever.
const callTimeoutMilliseconds = 5000;

// Keycloak answers a name another Login holds with this status.
const conflict = 409;

// The statuses with which Keycloak, or a proxy in front of it, says that it
// cannot serve now.
const unavailableStatuses = new Set([502, 503, 504]);

// Whether a call got no answer: `fetch` could not connect, or the call was
// given up on. Such an error is known by its name and not by its class,
// because one made by Node itself is not an instance of the classes that code
// run by Jest sees.
function gotNoAnswer(error: unknown): boolean {
  const { name, message } = error as { name?: unknown; message?: unknown };
  return (
    name === 'TimeoutError' ||
    name === 'AbortError' ||
    (name === 'TypeError' && message === 'fetch failed')
  );
}

// Whether Keycloak could not be reached: the call got no answer, or Keycloak
// answered that it cannot serve now. Any other failure means that Keycloak
// refused the call, or that the API went wrong, and is the API's fault.
function isUnreachable(error: unknown): boolean {
  if (error instanceof NetworkError) return unavailableStatuses.has(error.response.status);
  return gotNoAnswer(error);
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
        return Either.left(loginNameTaken(params.getName()));
      }
      // A call that was given up on may have been carried out all the same,
      // and Keycloak would then hold a Login of this name with no Vendor
      // behind it. Its identifier is not known, so its name is logged.
      this.logger.error(error, `A Login named ${params.getName()} could not be made`);
      return Either.left(failureOf(error, 'A Login could not be made'));
    }

    const given = await this.giveRole(administration, loginId, params.getRole());
    if (Either.isLeft(given)) {
      // A Login without its role is no use to anyone, and would hold the name.
      const deleted = await this.delete(loginId);
      return Either.left(Either.isLeft(deleted) ? deleted.left : given.left);
    }

    return Either.right(loginId);
  }

  // Keycloak renames a Login only while the realm lets names be edited, and
  // its user profile lets only `admin` edit one, which the API's client is.
  // An update changes only what it sends, so the Login keeps its password,
  // its roles and its required actions.
  async rename(params: RenameLoginParams): Promise<Either.Either<void, StructuredError>> {
    try {
      const administration = await this.logIn();
      await administration.users.update(
        { id: params.getLoginId() },
        { username: params.getName() },
      );
      return Either.right(undefined);
    } catch (error) {
      if (error instanceof NetworkError && error.response.status === conflict) {
        return Either.left(loginNameTaken(params.getName()));
      }
      // A call that was given up on may have been carried out all the same.
      this.logger.error(
        error,
        `The Login ${params.getLoginId()} could not be renamed ${params.getName()}`,
      );
      return Either.left(
        failureOf(error, `The Login ${params.getLoginId()} could not be renamed`),
      );
    }
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

  async setTemporaryPassword(
    params: SetTemporaryPasswordParams,
  ): Promise<Either.Either<void, StructuredError>> {
    const loginId = params.getLoginId();
    try {
      const administration = await this.logIn();
      // A temporary password makes Keycloak require the Login to replace it
      // again, as when the Login was made. Keycloak leaves its sessions open.
      await administration.users.resetPassword({
        id: loginId,
        credential: {
          type: 'password',
          value: params.getTemporaryPassword(),
          temporary: true,
        },
      });
      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, `The Login ${loginId} could not be given a new password`);
      return Either.left(
        failureOf(error, `The Login ${loginId} could not be given a new password`),
      );
    }
  }

  async disable(loginId: string): Promise<Either.Either<void, StructuredError>> {
    return this.setEnabled(loginId, false);
  }

  async enable(loginId: string): Promise<Either.Either<void, StructuredError>> {
    return this.setEnabled(loginId, true);
  }

  async endSessions(loginId: string): Promise<Either.Either<void, StructuredError>> {
    try {
      const administration = await this.logIn();
      await administration.users.logout({ id: loginId });
      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, `The sessions of the Login ${loginId} could not be ended`);
      return Either.left(
        failureOf(error, `The sessions of the Login ${loginId} could not be ended`),
      );
    }
  }

  // Keycloak changes only what an update names, so the Login keeps its name
  // and its password.
  private async setEnabled(
    loginId: string,
    enabled: boolean,
  ): Promise<Either.Either<void, StructuredError>> {
    const change = enabled ? 'enabled' : 'disabled';
    try {
      const administration = await this.logIn();
      await administration.users.update({ id: loginId }, { enabled });
      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, `The Login ${loginId} could not be ${change}`);
      return Either.left(failureOf(error, `The Login ${loginId} could not be ${change}`));
    }
  }

  // Gives a Login a realm role. The role is found among the roles the Login
  // may still be given: reading a role by its name would need a wider role of
  // the realm's administration than the API's client holds.
  private async giveRole(
    administration: KeycloakAdminClient,
    loginId: string,
    role: Role,
  ): Promise<Either.Either<void, StructuredError>> {
    try {
      const assignable = await administration.users.listAvailableRealmRoleMappings({
        id: loginId,
      });
      const found = assignable.find((each) => each.name === role.getRoleName());
      if (found?.id === undefined || found.name === undefined) {
        this.logger.error(`The realm has no role ${role.getRoleName()} to give a Login`);
        return Either.left(ServerError.of(`The realm has no role ${role.getRoleName()}`));
      }

      await administration.users.addRealmRoleMappings({
        id: loginId,
        roles: [{ id: found.id, name: found.name }],
      });
      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, `The Login ${loginId} could not be given its role`);
      return Either.left(failureOf(error, 'A Login could not be given its role'));
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
