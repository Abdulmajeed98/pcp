import type { RouteObject } from 'react-router';

import { EditContactDetailsPage } from '@/pages/edit-contact-details';
import { OffersPage } from '@/pages/offers';
import { PortalNotFoundPage } from '@/pages/portal-not-found';
import { VendorDetailsPage } from '@/pages/vendor-details';

// The Vendor portal's screens, by their addresses relative to the portal's
// first one. They are the children of a frame's route, which gives each the
// Vendor it shows through its `<Outlet context>`. The Vendor portal's own
// router mounts them at `/`, and the Admin console's mounts the same screens
// under a Vendor's page, for the Admin acting as that Vendor.
//
// The Offers screen is the portal's first address, and the first of the top
// bar's two sections. The details screen, the second, has an address of its
// own, `details`, and the form for the contact details is below it, so that
// the form's way back, `..`, leads to it. An address that matches no screen
// shows a "not found" message in the portal's language.
export const vendorPortalScreens: RouteObject[] = [
  { index: true, Component: OffersPage },
  {
    path: 'details',
    children: [
      { index: true, Component: VendorDetailsPage },
      { path: 'contact-details', Component: EditContactDetailsPage },
    ],
  },
  { path: '*', Component: PortalNotFoundPage },
];
