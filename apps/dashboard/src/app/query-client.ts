import { hashKey, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { callersVendorKey, isRefusedAsDeactivated } from '@/entities/vendor';
import { Unreachable } from '@/shared/api';

// A Vendor deactivated while its portal is open is refused at its next call
// to the API, whichever screen made it. The portal's frame then asks for the
// Caller's Vendor again, is refused the same way, and shows its plain message
// in place of the screen. That query's own refusal asks nothing again.
function askForTheCallersVendorAgainWhenDeactivated(
  error: unknown,
  queryHash?: string,
): void {
  if (!isRefusedAsDeactivated(error) || queryHash === hashKey(callersVendorKey)) return;
  void queryClient.invalidateQueries({ queryKey: callersVendorKey, exact: true });
}

// The one client of TanStack Query, for both halves of the dashboard. A
// refusal is an answer, and is shown at once: asking again would hold a 403 or
// a 404 on screen for several seconds and change nothing. Only a call that
// never reached the API is asked once more, as a phone's connection may have
// dropped for a moment.
export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      askForTheCallersVendorAgainWhenDeactivated(error, query.queryHash),
  }),
  mutationCache: new MutationCache({
    onError: (error) => askForTheCallersVendorAgainWhenDeactivated(error),
  }),
  defaultOptions: {
    queries: {
      retry: (failures, error) => error instanceof Unreachable && failures < 1,
    },
  },
});
