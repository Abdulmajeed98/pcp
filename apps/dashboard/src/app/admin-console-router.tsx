import { createBrowserRouter, Navigate, type DataRouter } from 'react-router';

import { CatalogPage } from '@/pages/catalog';
import { EditPartPage } from '@/pages/edit-part';
import { ChooseCategoryPage, NewPartPage } from '@/pages/new-part';
import { NewVendorPage } from '@/pages/new-vendor';
import { NotFoundPage } from '@/pages/not-found';
import { PartPage } from '@/pages/part';
import { VendorPage } from '@/pages/vendor';
import { VendorsPage } from '@/pages/vendors';

import { AdminConsoleFrame } from './layouts/admin-console-frame';

// The Admin console's screens, by their addresses. The Admin console opens on
// the Catalog, the first of its two sections. A Part, its edit form and a new
// Part are the Catalog's children, and a Vendor's page and a new Vendor are
// the Vendors' children, which each shows beside its list on a wide screen.
const routes = [
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
        ],
      },
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
