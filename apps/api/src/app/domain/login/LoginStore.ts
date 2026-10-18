import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

// What a new Login is made with.
export class CreateLoginParams {
  constructor(
    private readonly name: string,
    private readonly role: Role,
    private readonly temporaryPassword: string,
  ) {}

  getName(): string {
    return this.name;
  }

  getRole(): Role {
    return this.role;
  }

  getTemporaryPassword(): string {
    return this.temporaryPassword;
  }
}

// A new name for a Login.
export class RenameLoginParams {
  constructor(
    private readonly loginId: string,
    private readonly name: string,
  ) {}

  getLoginId(): string {
    return this.loginId;
  }

  getName(): string {
    return this.name;
  }
}

// Where Logins are kept: the identity service. It is the port, and
// infrastructure provides it over Keycloak's administration interface.
//
// Every method fails with `IDENTITY_SERVICE_UNAVAILABLE` while the identity
// service cannot be reached.
export abstract class LoginStore {
  // Makes a Login of this name, enabled, holding this platform role and no
  // other, with the temporary password, which it has to replace at its next
  // login. Gives its identifier. A name another Login holds fails with the
  // error `isLoginNameTaken` knows, and nothing is made.
  abstract create(
    params: CreateLoginParams,
  ): Promise<Either.Either<string, StructuredError>>;

  // Gives the Login with this identifier a new name. Its password, its roles
  // and whether it may log in stay as they were. A name another Login holds
  // fails with the error `isLoginNameTaken` knows, and nothing is changed.
  abstract rename(params: RenameLoginParams): Promise<Either.Either<void, StructuredError>>;

  // Deletes the Login with this identifier.
  abstract delete(loginId: string): Promise<Either.Either<void, StructuredError>>;

  // Stops the Login with this identifier logging in, or lets it log in again
  // with the password it had. Doing either when it is already done changes
  // nothing.
  abstract disable(loginId: string): Promise<Either.Either<void, StructuredError>>;

  abstract enable(loginId: string): Promise<Either.Either<void, StructuredError>>;

  // Ends every session of the Login with this identifier, so that a browser
  // logged in as it must log in again. A token already issued is not
  // withdrawn: it lasts until it runs out.
  abstract endSessions(loginId: string): Promise<Either.Either<void, StructuredError>>;
}
