import { test } from '@playwright/test';

import {
  authorizationOfTheDevelopmentAdmin,
  expectLoginScreen,
  expectNewPasswordScreen,
  submitTheLoginScreen,
} from './development-logins';
import { dashboardUrl } from './platform';
import { createAMadeUpVendor } from './vendors';

// The whole path on the running platform: the API makes the Vendor's Login in
// the development Keycloak, through the API's own client, with a temporary
// password, and Keycloak then makes the Vendor choose its own.
test("a made-up Vendor logs in at Keycloak's login screen with its login phone number in the stored form and its temporary password, and Keycloak shows the screen that asks for a new password", async ({
  browser,
  page,
  request,
}) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  const vendor = await createAMadeUpVendor(request, authorization);

  // A browser of its own, which knows nothing of the Admin's login.
  const vendorsBrowser = await browser.newContext();
  const vendorsPage = await vendorsBrowser.newPage();
  await vendorsPage.goto(dashboardUrl);
  await expectLoginScreen(vendorsPage);
  await submitTheLoginScreen(
    vendorsPage,
    vendor.loginPhoneNumber,
    vendor.temporaryPassword,
  );

  await expectNewPasswordScreen(vendorsPage);
  await vendorsBrowser.close();
});
