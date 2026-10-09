import { type ApiClient, createApiClient } from '@pcp/api-client';

import { apiUrl } from '@/shared/config';

// The client the Shopper app's server calls the API with. Shoppers have no
// account, so it carries no login.
export function apiClient(): ApiClient {
  return createApiClient({ baseUrl: apiUrl() });
}
