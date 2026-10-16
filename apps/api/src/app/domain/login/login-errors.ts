import { ServiceUnavailableError, StructuredError } from '@pcp/core';

// Keycloak's administration interface cannot be reached, or stopped
// answering. Nothing was changed, unless the message says otherwise.
export function identityServiceUnavailable(message: string): ServiceUnavailableError {
  return ServiceUnavailableError.of('IDENTITY_SERVICE_UNAVAILABLE', message);
}

// The identity service already holds a Login of the name asked for. A use
// case turns it into a refusal of the field the name came from.
export class LoginNameTaken extends StructuredError {
  static of(name: string): LoginNameTaken {
    return new LoginNameTaken(
      'LOGIN_NAME_TAKEN',
      `A Login named ${name} exists already`,
      'VALIDATION_ERROR',
    );
  }
}
