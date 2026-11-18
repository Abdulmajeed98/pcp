import { type APIRequestContext, type Browser, expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl } from './admin-vendors';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import {
  authorizationOfTheDevelopmentAdmin,
  logInToTheDashboard,
  openTheDashboardAs,
} from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import {
  arabicOfIraq,
  checkInEveryLanguageOfTheVendorPortal,
  chooseInThePortal,
  expectNoSidewaysScroll,
  expectPageIn,
  expectTheSameInEveryLanguage,
  languages,
  layoutOf,
  narrowWindow,
  readInEveryLanguageOfTheVendorPortal,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, snapsOf } from './motion-film';
import {
  goToTheSection,
  rowOfOffer,
  searchTheCatalogFor,
  theCatalogSearch,
} from './offers';
import {
  aMadeUpPartNumber,
  fulfilAPartRequest,
  type PartRequestAnswered,
  rejectAPartRequest,
  sendAPartRequest,
  vendorsPartRequests,
} from './part-requests';
import { apiUrl, dashboardUrl } from './platform';
import {
  askForItToBeAdded,
  expectThePartRequestsSectionCurrent,
  goToThePartRequests,
  listedPartRequests,
  noPartRequests,
  partRequestField,
  refusalOf,
  rowOfPartRequest,
  sendThePartRequest,
  stateOf,
  thePartRequestForm,
  theSentNote,
  theVendorsPartRequests,
} from './vendor-part-requests';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, arabic, english] = languages;

// A Vendor sends Part Requests from its portal and follows them, on a phone
// 360 pixels wide (REQ-1, REQ-4, LANG-8), in Kurdish, Arabic and English.
// The browser is set to Arabic as written in Iraq, so the portal opens in
// Arabic until its switch is used. No test quotes the portal's text, which
// the review of the translations may change: an element is found by its
// test id, where it leads or what it is, and what a screen shows is compared
// with what the API answers. Names, part numbers, prices and reasons are not
// translations, and are read as they are. Every Vendor, Part and part number
// is made up through the API, unique to the run.

// Calls the API as the development Admin, in a browser of its own that is
// closed afterwards.
async function asTheAdmin<Done>(
  browser: Browser,
  use: (request: APIRequestContext, authorization: string) => Promise<Done>,
): Promise<Done> {
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    return await use(context.request, authorization);
  } finally {
    await context.close();
  }
}

// Text as a Kurdish or an Arabic keyboard types it: each Western digit as
// its Arabic-Indic one.
function inArabicIndicDigits(text: string): string {
  return text.replace(/\d/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
}

// The address of the Vendor's Part Requests and of the form, in its own
// portal.
const partRequestsUrl = `${dashboardUrl}/part-requests`;
const theFormUrl = `${partRequestsUrl}/new`;

test.describe('a made-up Vendor with no Part Request yet', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('in Kurdish, goes to the Part Requests section, which is marked current and offers the form, sends a request with its digits typed on a Kurdish keyboard, and lands on its Part Requests with the request waiting, as the API answers it', async ({
    page,
    browser,
  }) => {
    await openTheDashboardAs(page, vendor);
    await chooseInThePortal(page, kurdish);
    await goToThePartRequests(page);
    await expect(page).toHaveURL(partRequestsUrl);
    await expectThePartRequestsSectionCurrent(page);
    await expect(noPartRequests(page)).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await noPartRequests(page).getByRole('link').click();
    await expect(page).toHaveURL(theFormUrl);
    const name = `Made-up requested PSU ${aWordUniqueToTheRun()}`;
    const partNumber = aMadeUpPartNumber();
    await partRequestField(page, 'category').selectOption('psu');
    await partRequestField(page, 'name').fill(name);
    await partRequestField(page, 'partNumber').fill(inArabicIndicDigits(partNumber));
    await partRequestField(page, 'iqdPrice').fill('٩٥٬٠٠٠');
    await partRequestField(page, 'warrantyMonths').fill('١٢');
    await expectNoSidewaysScroll(page);
    await sendThePartRequest(page).click();

    await expect(page).toHaveURL(partRequestsUrl);
    await expect(theSentNote(page)).toContainText(name);
    const row = listedPartRequests(page).first();
    await expect(row.getByTestId('part-number')).toHaveText(partNumber);
    await expect(row.getByTestId('part-request-name')).toHaveText(name);
    await expect(row.getByTestId('category')).toHaveAttribute('data-category', 'psu');
    await expect(row.getByTestId('iqd-price')).toHaveText('95,000 IQD');
    await expect(row.getByTestId('usd-price')).toHaveCount(0);
    await expect(stateOf(row)).toHaveAttribute('data-state', 'open');
    await expect(stateOf(row)).toHaveAttribute('data-days', '0');
    await expectNoSidewaysScroll(page);

    const [sent] = await asTheAdmin(browser, (request, authorization) =>
      vendorsPartRequests(request, authorization, vendor.vendorId),
    );
    expect(sent).toMatchObject({
      category: 'psu',
      name,
      partNumber,
      usdPrice: null,
      iqdPrice: 95_000,
      inStock: true,
      warrantyMonths: 12,
      state: 'open',
      daysSinceSent: 0,
    });
  });

  test('in English, a request with no price is refused beside the price, which takes the focus, and nothing is sent; the form with its refusal meets WCAG 2.2 level AA in light and in dark', async ({
    page,
    browser,
  }) => {
    await openTheDashboardAs(page, vendor, theFormUrl);
    await chooseInThePortal(page, english);
    await expect(thePartRequestForm(page)).toBeVisible();
    const partNumber = aMadeUpPartNumber();
    await partRequestField(page, 'category').selectOption('gpu');
    await partRequestField(page, 'name').fill(
      `Made-up requested GPU ${aWordUniqueToTheRun()}`,
    );
    await partRequestField(page, 'partNumber').fill(partNumber);

    const answered = page.waitForResponse(
      (response) =>
        response.url() === `${apiUrl}/v1/vendors/${vendor.vendorId}/part-requests` &&
        response.request().method() === 'POST',
    );
    await sendThePartRequest(page).click();
    expect((await answered).status()).toBe(400);

    await expect(refusalOf(page, 'usdPrice')).toBeVisible();
    await expect(partRequestField(page, 'usdPrice')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(partRequestField(page, 'usdPrice')).toBeFocused();
    await expect(page.getByTestId('refusal')).toHaveCount(0);
    await expect(page).toHaveURL(theFormUrl);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    const listed = await asTheAdmin(browser, (request, authorization) =>
      vendorsPartRequests(request, authorization, vendor.vendorId),
    );
    expect(listed.map((each) => each.partNumber)).not.toContain(partNumber);
  });

  test('the form is right to left in Kurdish and Arabic, with Western digits only, and never scrolls sideways', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, theFormUrl);
    await expect(thePartRequestForm(page)).toBeVisible();

    await checkInEveryLanguageOfTheVendorPortal(page);
  });
});

test.describe('a made-up Vendor whose catalog search finds nothing', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test('in Arabic, asks from the empty search for the Part to be added, the form carrying the words and the Category through a reload, and lands on its Part Requests with the request waiting', async ({
    page,
  }) => {
    const words = `Made-up Pretend Frostline ${aWordUniqueToTheRun()}`;
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    await expectPageIn(page, arabic);
    await searchTheCatalogFor(page, words);
    await page.locator('#catalog-category').selectOption('cpuCooler');
    const empty = page.getByRole('status').getByTestId('nothing-found');
    await expect(empty).toBeVisible();
    await expect(empty.getByTestId('search-every-category')).toBeVisible();
    await expect(askForItToBeAdded(page)).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await askForItToBeAdded(page).click();
    await expect(page).toHaveURL((url) => url.pathname === '/part-requests/new');
    const opened = new URL(page.url());
    expect(opened.searchParams.get('search')).toBe(words);
    expect(opened.searchParams.get('category')).toBe('cpuCooler');
    await expect(partRequestField(page, 'name')).toHaveValue(words);
    await expect(partRequestField(page, 'category')).toHaveValue('cpuCooler');
    await expect(page.getByTestId('from-the-search')).toContainText(words);

    await page.reload();
    await expect(partRequestField(page, 'name')).toHaveValue(words);
    await expect(partRequestField(page, 'category')).toHaveValue('cpuCooler');

    const partNumber = aMadeUpPartNumber();
    await partRequestField(page, 'partNumber').fill(partNumber);
    await partRequestField(page, 'usdPrice').fill('٢٤٫٩٩');
    await expectNoSidewaysScroll(page);
    await sendThePartRequest(page).click();

    await expect(page).toHaveURL(partRequestsUrl);
    await expect(theSentNote(page)).toContainText(words);
    const row = rowOfPartRequest(page, partNumber);
    await expect(row.getByTestId('part-request-name')).toHaveText(words);
    await expect(row.getByTestId('category')).toHaveAttribute('data-category', 'cpuCooler');
    await expect(row.getByTestId('usd-price')).toHaveText('24.99 $');
    await expect(stateOf(row)).toHaveAttribute('data-state', 'open');
    await expect(listedPartRequests(page).first()).toContainText(partNumber);
  });

  test('the empty search narrowed to a Category first searches every Category, and its way back from the form returns to the search as it was', async ({
    page,
  }) => {
    const words = `Made-up Pretend Gamma ${aWordUniqueToTheRun()}`;
    await openTheDashboardAs(page, vendor, `${dashboardUrl}/add`);
    await searchTheCatalogFor(page, words);
    await page.locator('#catalog-category').selectOption('gpu');
    await askForItToBeAdded(page).click();
    await expect(page).toHaveURL((url) => url.pathname === '/part-requests/new');

    // The form's way back, above its title, leads to the search it came from.
    await page.locator('main a[href^="/add?"]').click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/add' &&
        url.searchParams.get('search') === words &&
        url.searchParams.get('category') === 'gpu',
    );
    await expect(theCatalogSearch(page).getByRole('searchbox')).toHaveValue(words);

    await page.getByTestId('search-every-category').click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/add' &&
        url.searchParams.get('search') === words &&
        !url.searchParams.has('category'),
    );
    await expect(page.getByTestId('search-every-category')).toHaveCount(0);
    await askForItToBeAdded(page).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/part-requests/new' &&
        url.searchParams.get('search') === words &&
        !url.searchParams.has('category'),
    );
    await expect(partRequestField(page, 'category')).toHaveValue('');
    await expect(partRequestField(page, 'name')).toHaveValue(words);
  });
});

test.describe('a made-up Vendor whose requests the Admin fulfilled, rejected and left', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;
  let fulfilled: PartRequestAnswered;
  let rejected: PartRequestAnswered;
  let waiting: PartRequestAnswered;
  // The Admin's reason, in Kurdish and with Arabic-Indic digits, as the Admin
  // may write it, which the Vendor reads as written (LANG-4).
  const reason =
    'ئەم پارچەیە بە ژمارەی ٤٢ لە کاتالۆگدا هەیە: بیگەڕێ و ئۆفەرەکەت لەوێ زیاد بکە.';

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    await asTheAdmin(browser, async (request, authorization) => {
      part = await createAMadeUpPart(request, authorization, {}, 'gpu');
      const sent = (named: string, details: object = {}) =>
        sendAPartRequest(request, authorization, vendor.vendorId, {
          category: 'gpu',
          name: named,
          partNumber: aMadeUpPartNumber(),
          ...details,
        });
      fulfilled = await sent(`Made-up requested GPU ${aWordUniqueToTheRun()}`, {
        usdPrice: '412.50',
        iqdPrice: 650_000,
        warrantyMonths: 24,
      });
      rejected = await sent(`Made-up requested GPU ${aWordUniqueToTheRun()}`, {
        iqdPrice: 300_000,
        inStock: false,
      });
      waiting = await sent(
        `کارتی گرافیکی داواکراوی تاقیکاری ٧٠٠ ${aWordUniqueToTheRun()}`,
        {
          usdPrice: '99.00',
        },
      );
      expect(await fulfilAPartRequest(request, authorization, fulfilled.id, part.id)).toBe(
        'created',
      );
      await rejectAPartRequest(request, authorization, rejected.id, reason);
    });
  });

  test('its Part Requests show each state in every language, right to left in Kurdish and Arabic: added naming the Part and leading to the Offer, the reason as written, and waiting, as the API answers them', async ({
    page,
    browser,
  }) => {
    const answered = await asTheAdmin(browser, (request, authorization) =>
      vendorsPartRequests(request, authorization, vendor.vendorId),
    );
    const offerId = answered.find(({ id }) => id === fulfilled.id)?.offerId;
    expect(offerId).toEqual(expect.any(String));

    await openTheDashboardAs(page, vendor, partRequestsUrl);
    await expect(theVendorsPartRequests(page)).toBeVisible();
    await expect(listedPartRequests(page)).toHaveCount(3);
    const added = rowOfPartRequest(page, fulfilled.partNumber);
    const notAdded = rowOfPartRequest(page, rejected.partNumber);
    const stillWaiting = rowOfPartRequest(page, waiting.partNumber);

    const read = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expect(stateOf(added)).toHaveAttribute('data-state', 'fulfilled');
      await expect(stateOf(notAdded)).toHaveAttribute('data-state', 'rejected');
      await expect(stateOf(stillWaiting)).toHaveAttribute('data-state', 'open');
      const reasonShown = notAdded.getByTestId('reason');
      const name = stillWaiting.getByTestId('part-request-name');
      return {
        order: await listedPartRequests(page).getByTestId('part-number').allTextContents(),
        addedPart: await added.getByTestId('added-part').textContent(),
        seeOffer: await added.getByTestId('see-offer').getAttribute('href'),
        reason: await reasonShown.textContent(),
        reasonLaidOut: await layoutOf(reasonShown),
        name: await name.textContent(),
        nameLaidOut: await layoutOf(name),
        prices: await added.getByTestId('usd-price').textContent(),
        iqd: await added.getByTestId('iqd-price').textContent(),
        days: await stateOf(stillWaiting).getAttribute('data-days'),
      };
    });

    expectTheSameInEveryLanguage(read);
    expect(read.get(english)).toEqual({
      order: [waiting.partNumber, rejected.partNumber, fulfilled.partNumber],
      addedPart: part.name,
      seeOffer: `/offers/${offerId}`,
      reason,
      reasonLaidOut: { direction: 'rtl', keptApart: true },
      name: waiting.name,
      nameLaidOut: { direction: 'rtl', keptApart: true },
      prices: '412.50 $',
      iqd: '650,000 IQD',
      days: '0',
    });
    await expect(notAdded.getByTestId('send-corrected')).toHaveAttribute(
      'href',
      '/part-requests/new',
    );
    await expectAccessible(page);
  });

  test("the added request leads to the Vendor's Offer for the Part, made with the request's prices, which its Offers screen lists", async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, partRequestsUrl);
    await rowOfPartRequest(page, fulfilled.partNumber).getByTestId('see-offer').click();
    await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
    await expect(page.getByTestId('offer-screen').getByTestId('usd-price')).toHaveText(
      '412.50 $',
    );
    await expect(page.getByTestId('offer-screen').getByTestId('iqd-price')).toHaveText(
      '650,000 IQD',
    );

    await goToTheSection(page, 'offers');
    const offer = rowOfOffer(page, part.name);
    await expect(offer.getByTestId('usd-price')).toHaveText('412.50 $');
    await expect(offer.getByTestId('iqd-price')).toHaveText('650,000 IQD');
    await expect(offer.getByTestId('stock')).toHaveAttribute('data-in-stock', 'true');
    await expect(offer.getByTestId('warranty')).toContainText('24');
    await expectNoSidewaysScroll(page);
  });
});

test.describe('the development Admin acting as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  });

  test("sends a Part Request for the Vendor under the band, lands on the Vendor's Part Requests under it, and the Vendor's own portal then lists the request", async ({
    page,
    browser,
  }) => {
    const portal = `${vendorPageUrl(vendor.vendorId)}/portal`;
    await logInToTheDashboard(page, undefined, `${portal}/part-requests`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    await expect(noPartRequests(page)).toBeVisible();
    await page.getByRole('banner').getByTestId('send-part-request').click();
    await expect(page).toHaveURL(`${portal}/part-requests/new`);

    const name = `Made-up requested RAM ${aWordUniqueToTheRun()}`;
    const partNumber = aMadeUpPartNumber();
    await partRequestField(page, 'category').selectOption('ram');
    await partRequestField(page, 'name').fill(name);
    await partRequestField(page, 'partNumber').fill(partNumber);
    await partRequestField(page, 'usdPrice').fill('89');
    await sendThePartRequest(page).click();
    await expect(page).toHaveURL(`${portal}/part-requests`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    await expect(theSentNote(page)).toContainText(name);
    await expect(stateOf(rowOfPartRequest(page, partNumber))).toHaveAttribute(
      'data-state',
      'open',
    );

    const vendorsOwn = await browser.newContext({
      javaScriptEnabled: true,
      viewport: narrowWindow,
      locale: arabicOfIraq,
    });
    try {
      const vendorsPage = await vendorsOwn.newPage();
      await openTheDashboardAs(vendorsPage, vendor, partRequestsUrl);
      const row = rowOfPartRequest(vendorsPage, partNumber);
      await expect(row.getByTestId('part-request-name')).toHaveText(name);
      await expect(row.getByTestId('usd-price')).toHaveText('89 $');
      await expect(stateOf(row)).toHaveAttribute('data-state', 'open');
    } finally {
      await vendorsOwn.close();
    }
  });
});

test.describe('the motion of a send, as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;

  test.beforeAll(async ({ browser }) => {
    vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    await asTheAdmin(browser, (request, authorization) =>
      sendAPartRequest(request, authorization, vendor.vendorId, {
        category: 'case',
        name: `Made-up requested Case ${aWordUniqueToTheRun()}`,
        partNumber: aMadeUpPartNumber(),
        usdPrice: '120.00',
      }),
    );
  });

  // What a frame shows of the list the form returns to: how opaque the note
  // is, the height of the request just sent, and where the request sent
  // before it is drawn, in the page's own coordinates.
  interface Arrival {
    note: number | null;
    sent: number | null;
    below: number | null;
  }

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`after a send the note fades in and the request arrives first in the list, opening its space so that the row below moves down in no frame at once, ${reducedMotion} motion`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await openTheDashboardAs(page, vendor, theFormUrl);
      const partNumber = aMadeUpPartNumber();
      await partRequestField(page, 'category').selectOption('case');
      await partRequestField(page, 'name').fill(
        `Made-up requested Case ${aWordUniqueToTheRun()}`,
      );
      await partRequestField(page, 'partNumber').fill(partNumber);
      await partRequestField(page, 'usdPrice').fill('75');

      const frames = await film<Arrival, string>(
        page,
        (sentNumber) => {
          const opacityOf = (element: Element | null) => {
            let opacity = 1;
            for (
              let at = element;
              at !== null && at !== document.body;
              at = at.parentElement
            ) {
              opacity *= Number(getComputedStyle(at).opacity);
            }
            return opacity;
          };
          const rows = [...document.querySelectorAll('[data-testid="part-request"]')];
          const sent = rows.find(
            (row) =>
              row.querySelector('[data-testid="part-number"]')?.textContent === sentNumber,
          );
          const below = rows.find((row) => row !== sent);
          const note = document.querySelector('[data-testid="part-request-sent"]');
          return {
            note: note === null ? null : opacityOf(note),
            sent: sent === undefined ? null : sent.getBoundingClientRect().height,
            below:
              below === undefined
                ? null
                : below.getBoundingClientRect().top + window.scrollY,
          };
        },
        async () => {
          await sendThePartRequest(page).click();
          await expect(page).toHaveURL(partRequestsUrl);
        },
        { forMs: 2400, arg: partNumber },
      );

      const fading = frames.filter(
        ({ drawn }) => drawn.note !== null && drawn.note > 0.05 && drawn.note < 0.95,
      );
      expect(fading.length, 'the note fades in over several frames').toBeGreaterThan(2);
      // The request's height between none and its own, as its space opens.
      const opened = frames.at(-1)?.drawn.sent ?? 0;
      const opening = frames.filter(
        ({ drawn }) => drawn.sent !== null && drawn.sent > 1 && drawn.sent < opened - 1,
      );
      expect(
        opening.length,
        "the request's space opens over several frames",
      ).toBeGreaterThan(2);
      const drawn = frames.filter(({ drawn: each }) => each.below !== null);
      expect(
        snapsOf(
          'the row below the request sent',
          drawn.map(({ at, drawn: each }) => ({ at, value: each.below })),
        ),
      ).toEqual([]);
      expect(
        snapsOf(
          "the request's height",
          drawn.map(({ at, drawn: each }) => ({ at, value: each.sent })),
        ),
      ).toEqual([]);
      await expectNoSidewaysScroll(page);
    });
  }
});
