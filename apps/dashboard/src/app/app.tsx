import { AdminConsolePlaceholderPage } from '@/pages/admin-console-placeholder';
import { VendorPortalPlaceholderPage } from '@/pages/vendor-portal-placeholder';

import type { Half } from './halves';
import { VendorPortalFrame } from './layouts/vendor-portal-frame';

export function App({ half }: { half: Half }) {
  if (half === 'admin-console') return <AdminConsolePlaceholderPage />;

  return (
    <VendorPortalFrame>
      <VendorPortalPlaceholderPage />
    </VendorPortalFrame>
  );
}
