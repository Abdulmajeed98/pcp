import { createBrowserRouter, Navigate, type DataRouter } from 'react-router';

import { CatalogPage } from '@/pages/catalog';
import { EditPartPage } from '@/pages/edit-part';
import { ChooseCategoryPage, NewPartPage } from '@/pages/new-part';
import { NotFoundPage } from '@/pages/not-found';
import { PartPage } from '@/pages/part';

import { AdminConsoleFrame } from './layouts/admin-console-frame';

// The Admin console's screens, by their addresses. The Admin console opens on
// the Catalog, its only section so far.
const routes = [
  {
    path: '/',
    Component: AdminConsoleFrame,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      { path: 'catalog', Component: CatalogPage },
      { path: 'catalog/new', Component: ChooseCategoryPage },
      { path: 'catalog/new/:category', Component: NewPartPage },
      { path: 'catalog/parts/:partId', Component: PartPage },
      { path: 'catalog/parts/:partId/edit', Component: EditPartPage },
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
