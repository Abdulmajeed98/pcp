import { NotValidError, ServiceUnavailableError, StructuredError } from '@pcp/core';

// Keycloak's administration interface cannot be reached, or stopped
// answering. A call that was given up on may still have been carried out by
// Keycloak; the Store logs what it was.
export function identityServiceUnavailable(message: string): ServiceUnavailableError {
  return ServiceUnavailableError.of('IDENTITY_SERVICE_UNAVAILABLE', message);
}

const loginNameTakenCode = 'LOGIN_NAME_TAKEN';

// The identity service already holds a Login of the name asked for. A use
// case turns it into a refusal of the field the name came from.
export function loginNameTaken(name: string): NotValidError {
  return NotValidError.of(loginNameTakenCode, `A Login named ${name} exists already`);
}

export function isLoginNameTaken(error: StructuredError): boolean {
  return error.getCode() === loginNameTakenCode;
}
