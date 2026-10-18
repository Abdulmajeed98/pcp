import type { RouteObject } from 'react-router';

import { PortalNotFoundPage } from '@/pages/portal-not-found';
import { VendorDetailsPage } from '@/pages/vendor-details';

// The Vendor portal's screens, by their addresses relative to the portal's
// first one. They are the children of a frame's route, which gives each the
// Vendor it shows through its `<Outlet context>`: the Vendor portal's own
// router mounts them at `/`, and the Admin console's mounts the same screens
// under a Vendor's page when the Admin acts as that Vendor. The details
// screen is the portal's first address, and an address that matches no
// screen shows a "not found" message in the portal's language.
export const vendorPortalScreens: RouteObject[] = [
  { index: true, Component: VendorDetailsPage },
  { path: '*', Component: PortalNotFoundPage },
];
