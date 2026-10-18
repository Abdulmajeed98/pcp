import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import {
  authorizationOfTheDevelopmentAdmin,
  developmentAdmin,
  vendorNameInTheFrame,
} from './development-logins';
import {
  atTheLoginScreenInABrowserOfItsOwn,
  chooseKeycloaksLanguage,
  expectLoginScreen,
  expectNewPasswordScreen,
  expectTheLoginScreenToRefuse,
  expectTheNewPasswordScreenToRefuse,
  submitTheLoginScreen,
  submitTheNewPasswordScreen,
} from './keycloak-screens';
import {
  expectADifferentTextInEachLanguage,
  expectPageIn,
  type Language,
  languages,
} from './languages';
import { dashboardUrl } from './platform';
import {
  aNewPassword,
  createAMadeUpVendor,
  createAMadeUpVendorAsTheAdmin,
  expectTheVendorPortal,
  inArabicIndicDigitsWithSpaces,
  inLocalFormWithDashes,
  logInForTheFirstTime,
  temporaryLoginOf,
} from './vendors';

const [kurdish, arabic, english] = languages;

// The realm file's settings that the tests below check: its password policy,
// and its brute-force detection.
const realm = JSON.parse(
  readFileSync(
    join(__dirname, '..', '..', '..', 'services', 'keycloak', 'import', 'pcp-realm.json'),
    'utf8',
  ),
) as { passwordPolicy: string; failureFactor: number; quickLoginCheckMilliSeconds: number };

// The whole path on the running platform: the API makes the Vendor's Login in
// the development Keycloak, through the API's own client, with a temporary
// password, and Keycloak then makes the Vendor choose its own. Each Vendor
// logs in in a browser of its own, which knows nothing of the Admin's login.
test("a made-up Vendor logs in at Keycloak's login screen with its login phone number in the stored form and its temporary password, and Keycloak shows the screen that asks for a new password", async ({
  browser,
  page,
  request,
}) => {
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await submitTheLoginScreen(vendorsPage, temporaryLoginOf(vendor));

    await expectNewPasswordScreen(vendorsPage);
  });
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
// form is sent.
for (const { form, inThatForm } of [
  { form: 'in Arabic-Indic digits with spaces', inThatForm: inArabicIndicDigitsWithSpaces },
  { form: 'in local form with dashes', inThatForm: inLocalFormWithDashes },
]) {
  test(`a made-up Vendor types its login phone number ${form}, and logs in to the Vendor portal through its first login`, async ({
    browser,
    page,
    request,
  }) => {
    const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

    await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
      const login = await logInForTheFirstTime(vendorsPage, vendor, {
        loginPhoneNumberAsTyped: inThatForm(vendor.loginPhoneNumber),
      });

      await expect(vendorNameInTheFrame(vendorsPage)).toHaveText(login.vendorName);
    });
  });
}

// The realm's password policy: at least 8 characters, and not the Login's
// name, which is the login phone number in the stored form. Each refusal is
// shown in the alert above the form.
test('the screen that asks for a new password refuses one of 4 characters, and one that is the login phone number, and then takes a good one, and the Vendor portal opens', async ({
  browser,
  page,
  request,
}) => {
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await submitTheLoginScreen(vendorsPage, temporaryLoginOf(vendor));
    await expectNewPasswordScreen(vendorsPage);

    for (const refused of ['abcd', vendor.loginPhoneNumber]) {
      await expectTheNewPasswordScreenToRefuse(vendorsPage, refused);
      await expect(vendorsPage.locator('.pf-v5-c-alert.pf-m-danger')).toBeVisible();
    }
    await submitTheNewPasswordScreen(vendorsPage, aNewPassword());

    await expectTheVendorPortal(vendorsPage);
  });
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

// What it says when it refuses a new password: the two refusals of the
// password policy, a missing password and a confirmation that does not match.
// Each is sent once the pieces above are read, so the first refusal is the
// piece after them.
async function readTheRefusals(page: Page, loginPhoneNumber: string): Promise<string[]> {
  return [
    await expectTheNewPasswordScreenToRefuse(page, 'abcd'),
    await expectTheNewPasswordScreenToRefuse(page, loginPhoneNumber),
    await expectTheNewPasswordScreenToRefuse(page, ''),
    await expectTheNewPasswordScreenToRefuse(page, aNewPassword(), aNewPassword()),
  ];
}

// The words for the field, a Vendor's login phone number, in each language,
// as the word list gives them.
const thePhoneNumber = new Map<Language, string>([
  [kurdish, 'ژمارەی تەلەفۆن'],
  [arabic, 'رقم الهاتف'],
  [english, 'phone number'],
]);

// The language is chosen on the login screen, with its own select, before the
// Vendor logs in. Each language has a made-up Vendor of its own, in a browser
// of its own, so that no earlier choice is remembered.
test("the screen that asks for a new password, opened in each of the three languages with the login screen's own choice of language, declares that language, its text and its refusals differ between the three, its Kurdish text is not its English text, and its refusals give the realm's length in Western digits and name the phone number", async ({
  browser,
  page,
  request,
}) => {
  // The Admin logs in once: a second login in the same page would find the
  // Admin logged in already.
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  const texts = new Map<Language, string[]>();
  for (const language of languages) {
    const vendor = await createAMadeUpVendor(request, authorization);
    const said = await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
      await chooseKeycloaksLanguage(vendorsPage, language);
      await submitTheLoginScreen(vendorsPage, temporaryLoginOf(vendor));

      await expectNewPasswordScreen(vendorsPage);
      await expectPageIn(vendorsPage, language);
      const pieces: string[] = [];
      for (const piece of piecesOfTheNewPasswordScreen) {
        pieces.push((await vendorsPage.locator(piece).innerText()).trim());
      }
      return [...pieces, ...(await readTheRefusals(vendorsPage, vendor.loginPhoneNumber))];
    });
    texts.set(language, said);
  }

  expectADifferentTextInEachLanguage(
    new Map([...texts].map(([language, said]) => [language, said.join('\n')])),
  );
  const inKurdish = texts.get(kurdish) ?? [];
  const inEnglish = texts.get(english) ?? [];
  expect(inKurdish).toHaveLength(inEnglish.length);
  // Keycloak's English length message, shown on the Kurdish screen, would
  // differ from the English screen's only by its digit, ٨ for 8. The
  // platform's numbers are in Western digits (LANG-5).
  inKurdish.forEach((text, index) => {
    expect(text, `piece ${index + 1} in Kurdish`).not.toBe(inEnglish[index]);
  });
  // The theme writes the policy's length into the Kurdish and the Arabic
  // message itself, so a change to the realm's length fails here until the
  // messages follow it. The policy's other refusal names the field as the
  // login screen does.
  const minimumLength = /length\((\d+)\)/.exec(realm.passwordPolicy)?.[1];
  expect(minimumLength, "the realm's password policy names a length").toBeDefined();
  const lengthRefusal = piecesOfTheNewPasswordScreen.length;
  for (const [language, said] of texts) {
    said.forEach((text, index) => {
      expect(text, `piece ${index + 1} in ${language.name}`).not.toMatch(/[٠-٩۰-۹]/);
    });
    expect(said[lengthRefusal], `the length refusal in ${language.name}`).toContain(
      minimumLength,
    );
    expect(
      said[lengthRefusal + 1],
      `the phone number refusal in ${language.name}`,
    ).toContain(thePhoneNumber.get(language));
  }
});

// The realm's brute-force detection: how many wrong passwords in a row lock a
// Login, and how far apart two wrong passwords must be for its quick-login
// check, which locks a Login sooner, to leave it alone.
const { failureFactor, quickLoginCheckMilliSeconds } = realm;

// A locked Login is told the same as a wrong password, so the right password
// being refused is what shows the lock. On the Kurdish login screen both are
// the theme's Kurdish, the same text. The Vendor is never used again.
test("after the configured number of wrong passwords in a row, sent further apart than the quick-login check's interval, a made-up Vendor of its own is refused its right password, on the Kurdish login screen with a wrong password's text", async ({
  browser,
  page,
  request,
}) => {
  const apart = quickLoginCheckMilliSeconds + 500;
  test.setTimeout(30_000 + failureFactor * apart);
  const vendor = await createAMadeUpVendorAsTheAdmin(page, request);
  const login = temporaryLoginOf(vendor);

  await atTheLoginScreenInABrowserOfItsOwn(browser, async (vendorsPage) => {
    await chooseKeycloaksLanguage(vendorsPage, kurdish);
    let wrongPasswordsText = '';
    for (let failure = 1; failure <= failureFactor; failure++) {
      wrongPasswordsText = await expectTheLoginScreenToRefuse(vendorsPage, {
        ...login,
        password: `wrong-password-${failure}`,
      });
      await vendorsPage.waitForTimeout(apart);
    }

    const lockedText = await expectTheLoginScreenToRefuse(vendorsPage, login);
    expect(lockedText).toBe(wrongPasswordsText);
  });
});

// The script leaves a name with a letter in it alone, dashes and all.
test('the development Admin still logs in by its name, typed at the login screen', async ({
  page,
}) => {
  await page.goto(dashboardUrl);
  await expectLoginScreen(page);
  await submitTheLoginScreen(page, developmentAdmin, { typeTheName: true });

  await page.waitForURL(`${dashboardUrl}/**`);
  await expect(page.getByTestId('caller-name')).toHaveText(developmentAdmin.name);
});
