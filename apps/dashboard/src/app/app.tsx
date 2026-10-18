import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { useDirectionShown } from '@/shared/i18n';
import { DirectionProvider } from '@/shared/ui';

import { adminConsoleRouter } from './admin-console-router';
import type { Half } from './halves';
import { queryClient } from './query-client';
import { vendorPortalRouter } from './vendor-portal-router';

// Each half of the dashboard, with what both share: TanStack Query's client,
// and the reading direction Base UI's components lay themselves out by. Each
// half has a router of its own, with screens at addresses of their own, and
// an address of the other half's matches none of them.
export function App({ half }: { half: Half }) {
  const direction = useDirectionShown();

  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider direction={direction}>
        <RouterProvider
          router={half === 'admin-console' ? adminConsoleRouter() : vendorPortalRouter()}
        />
      </DirectionProvider>
    </QueryClientProvider>
  );
}
