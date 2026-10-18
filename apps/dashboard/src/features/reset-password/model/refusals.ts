import { formatNumber } from '@pcp/i18n';

import { Refusal } from '@/shared/api';

// Why the password was not reset, in the Admin console's English: Keycloak
// that cannot be reached, a refusal, or an API that cannot be reached.
export function whyNotReset(error: unknown): string {
  if (!(error instanceof Refusal)) {
    return 'The API cannot be reached. Check the connection, and reset the password again.';
  }
  if (error.code === 'IDENTITY_SERVICE_UNAVAILABLE') {
    return 'The login service cannot be reached, so the reset may not be finished. Reset the password again in a moment.';
  }
  return `The API refused the reset, with ${formatNumber(error.status)}, ${error.code}.`;
}
