import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { VendorPortalPlaceholderPage } from '@/pages/vendor-portal-placeholder';
import { useDirectionShown } from '@/shared/i18n';
import { DirectionProvider } from '@/shared/ui';

import { adminConsoleRouter } from './admin-console-router';
import type { Half } from './halves';
import { VendorPortalFrame } from './layouts/vendor-portal-frame';
import { queryClient } from './query-client';

// Each half of the dashboard, with what both share: TanStack Query's client,
// and the reading direction Base UI's components lay themselves out by. The
// Admin console has screens at addresses of their own. The Vendor portal has
// no router, so every address shows it, the Admin console's among them.
export function App({ half }: { half: Half }) {
  const direction = useDirectionShown();

  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider direction={direction}>
        {half === 'admin-console' ? (
          <RouterProvider router={adminConsoleRouter()} />
        ) : (
          <VendorPortalFrame>
            <VendorPortalPlaceholderPage />
          </VendorPortalFrame>
        )}
      </DirectionProvider>
    </QueryClientProvider>
  );
}
