import type { RouteObject } from 'react-router';

import { CatalogSearchPage } from '@/pages/catalog-search';
import { EditContactDetailsPage } from '@/pages/edit-contact-details';
import { NewOfferPage } from '@/pages/new-offer';
import { OfferPage } from '@/pages/offer';
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
//
// Below the Offers screen, `add` is the catalog search from which an Offer is
// added, with the form for a new Offer of a Part below it, `add/<partId>`,
// so that the form's way back, and its way after a save, `..`, lead to the
// search. One Offer has the address `offers/<offerId>`, whose way back leads
// to the Offers screen.
export const vendorPortalScreens: RouteObject[] = [
  { index: true, Component: OffersPage },
  {
    path: 'add',
    children: [
      { index: true, Component: CatalogSearchPage },
      { path: ':partId', Component: NewOfferPage },
    ],
  },
  { path: 'offers/:offerId', Component: OfferPage },
  {
    path: 'details',
    children: [
      { index: true, Component: VendorDetailsPage },
      { path: 'contact-details', Component: EditContactDetailsPage },
    ],
  },
  { path: '*', Component: PortalNotFoundPage },
];
