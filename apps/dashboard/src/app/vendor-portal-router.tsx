import { createBrowserRouter, type DataRouter } from 'react-router';

import { VendorPortalFrame } from './layouts/vendor-portal-frame';
import { vendorPortalScreens } from './vendor-portal-screens';

let router: DataRouter | undefined;

// The router of the Vendor portal, made the first time it is asked for, after
// the login, as the Admin console's is. Its frame learns the Vendor from the
// API, and its screens are at the dashboard's own addresses.
export function vendorPortalRouter(): DataRouter {
  router ??= createBrowserRouter([
    { path: '/', Component: VendorPortalFrame, children: vendorPortalScreens },
  ]);
  return router;
}
