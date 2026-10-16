import { expect, test } from '@playwright/test';

import {
  authorizationOfTheDevelopmentAdmin,
  chooseKeycloaksLanguage,
  expectLoginScreen,
  expectNewPasswordScreen,
  submitTheLoginScreen,
} from './development-logins';
import { expectADifferentTextInEachLanguage, type Language, languages } from './languages';
import { dashboardUrl } from './platform';
import {
  createAMadeUpVendor,
  inArabicIndicDigitsWithSpaces,
  inLocalFormWithDashes,
  logInForTheFirstTime,
} from './vendors';

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
  const context = await browser.newContext();
  const vendorsPage = await context.newPage();
  await vendorsPage.goto(dashboardUrl);
  await expectLoginScreen(vendorsPage);
  await submitTheLoginScreen(
    vendorsPage,
    vendor.loginPhoneNumber,
    vendor.temporaryPassword,
  );

  await expectNewPasswordScreen(vendorsPage);
  await context.close();
});

// A Vendor's Login is named by its login phone number, so the field is
// called that, in each language, with the login screen's own choice of
// language. English is the source of the wording.
test('the login screen\'s name field is labelled "Phone number", in a different text in each of the three languages', async ({
  page,
}) => {
  await page.goto(dashboardUrl);
  await expectLoginScreen(page);

  const labels = new Map<Language, string>();
  for (const language of languages) {
    await chooseKeycloaksLanguage(page, language);
    labels.set(language, await page.locator('label[for=username]').innerText());
  }

  expect(labels.get(languages[2])).toBe('Phone number');
  expectADifferentTextInEachLanguage(labels);
});

// The theme's script turns what is typed into the stored form before the
// form is sent. Each Vendor logs in in a browser of its own.
for (const { form, write } of [
  { form: 'in Arabic-Indic digits with spaces', write: inArabicIndicDigitsWithSpaces },
  { form: 'in local form with dashes', write: inLocalFormWithDashes },
]) {
  test(`a made-up Vendor types its login phone number ${form}, and logs in to the Vendor portal through its first login`, async ({
    browser,
    page,
    request,
  }) => {
    const authorization = await authorizationOfTheDevelopmentAdmin(page);
    const vendor = await createAMadeUpVendor(request, authorization);

    const context = await browser.newContext();
    const vendorsPage = await context.newPage();
    const login = await logInForTheFirstTime(
      vendorsPage,
      vendor,
      write(vendor.loginPhoneNumber),
    );

    await expect(vendorsPage.getByTestId('caller-name')).toHaveText(login.name);
    await context.close();
  });
}
