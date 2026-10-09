import { createApiClient } from '@pcp/api-client';

import { validToken } from '@/shared/auth';
import { settings } from '@/shared/config';

// The client the dashboard calls the API with. Before each call to an
// endpoint that needs a login, it asks for a token that is still valid.
export const apiClient = createApiClient({
  baseUrl: settings.apiUrl,
  getToken: validToken,
});
