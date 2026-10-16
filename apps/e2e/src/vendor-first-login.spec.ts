import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import {
  authorizationOfTheDevelopmentAdmin,
  chooseKeycloaksLanguage,
  developmentAdmin,
  expectLoginScreen,
  expectNewPasswordScreen,
  expectTheVendorPortal,
  submitTheLoginScreen,
  submitTheNewPasswordScreen,
} from './development-logins';
import {
  expectADifferentTextInEachLanguage,
  expectPageIn,
  type Language,
  languages,
} from './languages';
import { dashboardUrl, realmUrl } from './platform';
import {
  aNewPassword,
  createAMadeUpVendor,
  inArabicIndicDigitsWithSpaces,
  inLocalFormWithDashes,
  logInForTheFirstTime,
} from './vendors';

const [kurdish, , english] = languages;

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

  expect(labels.get(english)).toBe('Phone number');
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

// Sends a new password on the screen that asks for one, and expects it to be
// refused: Keycloak answers the form with the same screen, an error above the
// form, rather than sending the browser on to the dashboard.
async function expectTheNewPasswordRefused(page: Page, password: string): Promise<void> {
  const answered = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().startsWith(`${realmUrl}/login-actions/required-action`),
  );
  await submitTheNewPasswordScreen(page, password);

  expect((await answered).status()).toBe(200);
  await expectNewPasswordScreen(page);
  await expect(page.locator('.pf-v5-c-alert.pf-m-danger')).toBeVisible();
}

// The realm's password policy: at least 8 characters, and not the Login's
// name, which is the login phone number in the stored form.
test('the screen that asks for a new password refuses one of 4 characters, and one that is the login phone number, and then takes a good one, and the Vendor portal opens', async ({
  browser,
  page,
  request,
}) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  const vendor = await createAMadeUpVendor(request, authorization);

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

  await expectTheNewPasswordRefused(vendorsPage, 'abcd');
  await expectTheNewPasswordRefused(vendorsPage, vendor.loginPhoneNumber);
  await submitTheNewPasswordScreen(vendorsPage, aNewPassword());

  await expectTheVendorPortal(vendorsPage);
  await context.close();
});

// What the screen that asks for a new password says, piece by piece: its
// heading, the warning above its form, the labels of its fields and its box,
// and its button.
const piecesOfTheNewPasswordScreen = [
  '#kc-page-title',
  '.pf-v5-c-alert .kc-feedback-text',
  'label[for=password-new]',
  'label[for=password-confirm]',
  'label[for=logout-sessions]',
  '#kc-submit',
];

// The language is chosen on the login screen, with its own select, before the
// Vendor logs in. Each language has a made-up Vendor of its own, in a browser
// of its own, so that no earlier choice is remembered.
test("the screen that asks for a new password, opened in each of the three languages with the login screen's own choice of language, declares that language, its text differs between the three, and its Kurdish text is not its English text", async ({
  browser,
  page,
  request,
}) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);

  const texts = new Map<Language, string[]>();
  for (const language of languages) {
    const vendor = await createAMadeUpVendor(request, authorization);
    const context = await browser.newContext();
    const vendorsPage = await context.newPage();
    await vendorsPage.goto(dashboardUrl);
    await expectLoginScreen(vendorsPage);
    await chooseKeycloaksLanguage(vendorsPage, language);
    await submitTheLoginScreen(
      vendorsPage,
      vendor.loginPhoneNumber,
      vendor.temporaryPassword,
    );

    await expectNewPasswordScreen(vendorsPage);
    await expectPageIn(vendorsPage, language);
    const pieces: string[] = [];
    for (const piece of piecesOfTheNewPasswordScreen) {
      pieces.push((await vendorsPage.locator(piece).innerText()).trim());
    }
    texts.set(language, pieces);
    await context.close();
  }

  expectADifferentTextInEachLanguage(
    new Map([...texts].map(([language, pieces]) => [language, pieces.join('\n')])),
  );
  const inKurdish = texts.get(kurdish) ?? [];
  const inEnglish = texts.get(english) ?? [];
  piecesOfTheNewPasswordScreen.forEach((piece, index) => {
    expect(inKurdish[index], `${piece} in Kurdish`).not.toBe(inEnglish[index]);
  });
});

// The realm's brute-force detection, as the realm file configures it: how
// many wrong passwords in a row lock a Login, and how far apart two wrong
// passwords must be for its quick-login check, which locks a Login sooner,
// to leave it alone.
const { failureFactor, quickLoginCheckMilliSeconds } = JSON.parse(
  readFileSync(
    join(__dirname, '..', '..', '..', 'services', 'keycloak', 'import', 'pcp-realm.json'),
    'utf8',
  ),
) as { failureFactor: number; quickLoginCheckMilliSeconds: number };

// Sends the login screen a name and a password, and expects the login to be
// refused: Keycloak answers the form with the login screen again, with an
// error under the name field, rather than sending the browser on.
async function expectTheLoginRefused(
  page: Page,
  name: string,
  password: string,
): Promise<void> {
  const answered = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().startsWith(`${realmUrl}/login-actions/authenticate`),
  );
  await submitTheLoginScreen(page, name, password);

  expect((await answered).status()).toBe(200);
  await expectLoginScreen(page);
  await expect(page.locator('#input-error-username')).toBeVisible();
}

// A locked Login is told the same as a wrong password, so the right password
// being refused is what shows the lock. The Vendor is never used again.
test('after the configured number of wrong passwords in a row, sent more than a second apart, a made-up Vendor of its own is refused its right password', async ({
  browser,
  page,
  request,
}) => {
  const apart = quickLoginCheckMilliSeconds + 500;
  test.setTimeout(30_000 + failureFactor * apart);
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  const vendor = await createAMadeUpVendor(request, authorization);

  const context = await browser.newContext();
  const vendorsPage = await context.newPage();
  await vendorsPage.goto(dashboardUrl);
  await expectLoginScreen(vendorsPage);
  for (let failure = 1; failure <= failureFactor; failure++) {
    await expectTheLoginRefused(
      vendorsPage,
      vendor.loginPhoneNumber,
      `wrong-password-${failure}`,
    );
    await vendorsPage.waitForTimeout(apart);
  }

  await expectTheLoginRefused(
    vendorsPage,
    vendor.loginPhoneNumber,
    vendor.temporaryPassword,
  );
  await context.close();
});

// The script leaves a name with a letter in it alone, dashes and all.
test('the development Admin still logs in by its name, typed at the login screen', async ({
  page,
}) => {
  await page.goto(dashboardUrl);
  await expectLoginScreen(page);
  await submitTheLoginScreen(
    page,
    developmentAdmin.name,
    developmentAdmin.password,
    'typed',
  );

  await page.waitForURL(`${dashboardUrl}/**`);
  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);
});
