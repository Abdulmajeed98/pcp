import type { RouteObject } from 'react-router';

import { EditContactDetailsPage } from '@/pages/edit-contact-details';
import { PortalNotFoundPage } from '@/pages/portal-not-found';
import { VendorDetailsPage } from '@/pages/vendor-details';

// The Vendor portal's screens, by their addresses relative to the portal's
// first one. They are the children of a frame's route, which gives each the
// Vendor it shows through its `<Outlet context>`. The Vendor portal's own
// router mounts them at `/`, and the Admin console's is to mount the same
// screens under a Vendor's page, for the Admin acting as that Vendor
// (`accounts` ticket 09). The details screen is the portal's first address,
// the form for its contact details is below it, and an address that matches
// no screen shows a "not found" message in the portal's language.
export const vendorPortalScreens: RouteObject[] = [
  { index: true, Component: VendorDetailsPage },
  { path: 'contact-details', Component: EditContactDetailsPage },
  { path: '*', Component: PortalNotFoundPage },
];
