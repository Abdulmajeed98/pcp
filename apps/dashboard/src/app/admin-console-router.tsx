import { createBrowserRouter, Navigate, type DataRouter } from 'react-router';

import { CatalogPage } from '@/pages/catalog';
import { EditPartPage } from '@/pages/edit-part';
import { ChooseCategoryPage, NewPartPage } from '@/pages/new-part';
import { NotFoundPage } from '@/pages/not-found';
import { PartPage } from '@/pages/part';

import { AdminConsoleFrame } from './layouts/admin-console-frame';

// The Admin console's screens, by their addresses. The Admin console opens on
// the Catalog, its only section so far. A Part, its edit form and a new Part
// are the Catalog's children, which it shows beside its list on a wide
// screen.
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
      { path: '*', Component: NotFoundPage },
    ],
  },
];

let router: DataRouter | undefined;

// The router of the Admin console, made the first time it is asked for. That
// is after the login, once keycloak-js has taken the login's answer off the
// address, so the router starts from the address the Admin asked for. The
// Vendor portal has no router: every address shows it.
export function adminConsoleRouter(): DataRouter {
  router ??= createBrowserRouter(routes);
  return router;
}
