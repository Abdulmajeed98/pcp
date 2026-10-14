// Helpers for tests. Only test files import this entry.
export {
  accessDenied,
  expectErrorResponse,
  expectErrorResponseShape,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from './assertions/error-response.assertions';
export {
  emptyTables,
  startTestDatabase,
  stopTestDatabase,
  type TestDatabaseSettings,
} from './database/test-database';
export { type KeycloakStandIn, startKeycloakStandIn } from './keycloak/keycloak-stand-in';
export {
  bearerHeader,
  createTestKey,
  signToken,
  signTokenWithoutKeyName,
  type TestKey,
  tokenClaims,
  type TokenOptions,
  tokenSignedWithThePublicKeyAsSecret,
  unsignedToken,
  withChangedClaims,
} from './token/token-factory';
