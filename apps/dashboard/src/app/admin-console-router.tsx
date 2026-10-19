import { createBrowserRouter, Navigate, type DataRouter } from 'react-router';

import { CatalogPage } from '@/pages/catalog';
import { EditPartPage } from '@/pages/edit-part';
import { EditVendorPage } from '@/pages/edit-vendor';
import { ExpiringOffersPage } from '@/pages/expiring-offers';
import { MissingSpecificationsPage } from '@/pages/missing-specifications';
import { ChooseCategoryPage, NewPartPage } from '@/pages/new-part';
import { NewVendorPage } from '@/pages/new-vendor';
import { NotFoundPage } from '@/pages/not-found';
import { PartPage } from '@/pages/part';
import { VendorPage } from '@/pages/vendor';
import { VendorsPage } from '@/pages/vendors';

import { ActingAsVendorFrame } from './layouts/acting-as-vendor-frame';
import { AdminConsoleFrame } from './layouts/admin-console-frame';
import { vendorPortalScreens } from './vendor-portal-screens';

// The Admin console's screens, by their addresses. The Admin console opens on
// the Catalog, the first of its sections. A Part, its edit form and a new
// Part are the Catalog's children, and a Vendor's page, its edit form and a
// new Vendor are the Vendors' children, which each shows beside its list on
// a wide screen. A Part's edit form is also a child of the Missing
// specifications, which saving returns to. The Expiring Offers lead to a
// Vendor's page under the Vendors.
//
// A Vendor's portal, for the Admin acting as that Vendor, is under the
// Vendor's page: the Vendor portal's own screens, in the Vendor portal's
// frame with the band, and not in the Admin console's frame. The frame
// learns the Vendor from the address, and gives it to each screen.
const routes = [
  {
    path: '/vendors/:vendorId/portal',
    Component: ActingAsVendorFrame,
    children: vendorPortalScreens,
  },
  {
    path: '/',
    Component: AdminConsoleFrame,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      {
        path: 'catalog',
        Component: CatalogPage,
        children: [
          { path: 'new', Component: ChooseCategoryPage },
          { path: 'new/:category', Component: NewPartPage },
          { path: 'parts/:partId', Component: PartPage },
          { path: 'parts/:partId/edit', Component: EditPartPage },
        ],
      },
      {
        path: 'vendors',
        Component: VendorsPage,
        children: [
          { path: 'new', Component: NewVendorPage },
          { path: ':vendorId', Component: VendorPage },
          { path: ':vendorId/edit', Component: EditVendorPage },
        ],
      },
      {
        path: 'missing-specifications',
        Component: MissingSpecificationsPage,
        children: [
          {
            path: 'parts/:partId/edit',
            element: (
              <EditPartPage
                returnTo={{
                  address: '/missing-specifications',
                  name: 'Missing specifications',
                }}
              />
            ),
          },
        ],
      },
      { path: 'expiring-offers', Component: ExpiringOffersPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

let router: DataRouter | undefined;

// The router of the Admin console, made the first time it is asked for. That
// is after the login, once keycloak-js has taken the login's answer off the
// address, so the router starts from the address the Admin asked for.
export function adminConsoleRouter(): DataRouter {
  router ??= createBrowserRouter(routes);
  return router;
}
