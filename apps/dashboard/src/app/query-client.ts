import { QueryClient } from '@tanstack/react-query';

import { Unreachable } from '@/shared/api';

// The one client of TanStack Query, for both halves of the dashboard. A
// refusal is an answer, and is shown at once: asking again would hold a 403 or
// a 404 on screen for several seconds and change nothing. Only a call that
// never reached the API is asked once more, as a phone's connection may have
// dropped for a moment.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failures, error) => error instanceof Unreachable && failures < 1,
    },
  },
});
