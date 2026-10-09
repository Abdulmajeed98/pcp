export { type ApiClient, type ApiClientOptions, createApiClient } from './api-client';
export type {
  CallerResponse,
  ErrorResponse,
  StatusResponse,
  SubErrorResponse,
} from './generated/types.gen';

// Placeholder: the two frontends still prove with it that `@pcp/api-client`
// resolves. Delete it when both use the client itself.
export const apiClientPlaceholder = '@pcp/api-client';
