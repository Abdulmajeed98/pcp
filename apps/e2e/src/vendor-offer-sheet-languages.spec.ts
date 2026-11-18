import { type Browser, expect, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { vendorPageUrl } from './admin-vendors';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import { logInToTheDashboard, openTheDashboardAs } from './development-logins';
import { type VendorLoginDetails } from './keycloak-screens';
import {
  addressIn,
  arabicOfIraq,
  chooseInThePortal,
  expectNoSidewaysScroll,
  expectTheSameInEveryLanguage,
  languages,
  layoutOf,
  narrowWindow,
  readInEveryLanguageOfTheVendorPortal,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { fastestSmooth, film, snapsOf } from './motion-film';
import {
  askForItFrom,
  asTheAdmin,
  changedOfferSheet,
  chooseTheFile,
  downloadTheOfferSheet,
  expectTheCountsOf,
  expectTheOfferSheetSectionCurrent,
  goToTheOfferSheet,
  type OfferSheetResult,
  rowsOfTheOfferSheet,
  theAddedRows,
  theDownloadButton,
  theFileRefusal,
  theOfferSheetScreen,
  theResult,
  theRowsMatchedByYourOffer,
  theSkippedGroup,
  theSkippedRow,
  theUploadButton,
  theVendorsOffers,
  theVisibleOffersOf,
  uploadAndApply,
  uploadTheOfferSheet,
} from './offer-sheet';
import { addAnOffer, goToTheSection, rowOfOffer, theCatalogSearch } from './offers';
import { offerOf } from './part-page';
import {
  aMadeUpPartNumber,
  fulfilAPartRequest,
  vendorsPartRequests,
} from './part-requests';
import { dashboardUrl } from './platform';
import {
  goToThePartRequests,
  partRequestField,
  refusalOf,
  rowOfPartRequest,
  sendThePartRequest,
  thePartRequestForm,
} from './vendor-part-requests';
import { aMadeUpVendorThatHasLoggedIn } from './vendors';

const [kurdish, , english] = languages;

// A Vendor downloads its Offer sheet, changes it, uploads it and reads the
// upload's result, then turns a row that matched no Part into a Part
// Request, on a phone 360 pixels wide (SHT-1 to SHT-7, success criteria 9
// and 10, LANG-8), in Kurdish, Arabic and English. The browser is set to
// Arabic as written in Iraq, so the portal opens in Arabic until its switch
// is used. No test quotes the portal's text or the file's words, which the
// review of the translations may change: an element is found by its test
// id, where it leads or what it is, a cell by its column, and what a screen
// shows is compared with what the API answers. Every Vendor, Part and part
// number is made up through the API, unique to the run.

// The address of the Offer sheet screen, in the Vendor's own portal.
const offerSheetUrl = `${dashboardUrl}/offer-sheet`;

// The file's word for yes, as the download wrote it in the row of an Offer
// in stock: the test copies it rather than quote it.
function yesIn(rows: { partNumber: string | null; inStock: string | null }[], of: string) {
  const yes = rows.find((row) => row.partNumber === of)?.inStock;
  if (yes === null || yes === undefined) throw new Error(`No row of ${of}.`);
  return yes;
}

test.describe('success criteria 9 and 10: a made-up Vendor changes its Offers with its Offer sheet, and a row that matched no Part becomes an Offer once the Admin adds its Part', () => {
  for (const language of languages) {
    test(`in ${language.name}: downloads its two Offers, changes a price, adds a known and an unknown part number, uploads the file, sees the result and its Offers as the API answers them, asks for the unknown row's Part, and once the Admin adds it, the same file applies the row`, async ({
      page,
      browser,
    }) => {
      test.setTimeout(180_000);
      const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
      const parts = await asTheAdmin(browser, async (request, authorization) => {
        const changed = await createAMadeUpPart(request, authorization, {}, 'gpu');
        const confirmed = await createAMadeUpPart(request, authorization, {}, 'cpu');
        const added = await createAMadeUpPart(request, authorization, {}, 'psu');
        await addAnOffer(request, authorization, vendor.vendorId, changed.id, {
          usdPrice: '349.99',
          iqdPrice: 550_000,
          warrantyMonths: 12,
        });
        await addAnOffer(request, authorization, vendor.vendorId, confirmed.id, {
          usdPrice: '199.00',
        });
        return { changed, confirmed, added };
      });

      // 1. The Vendor downloads its Offer sheet, in the portal's language,
      // under the name the API gives it. It holds a row for each Offer.
      await openTheDashboardAs(page, vendor);
      await chooseInThePortal(page, language);
      await goToTheOfferSheet(page);
      await expect(page).toHaveURL(offerSheetUrl);
      await expectTheOfferSheetSectionCurrent(page);
      await expect(page.getByTestId('offers-in-the-file')).toHaveAttribute(
        'data-count',
        '2',
      );
      await expectNoSidewaysScroll(page);
      const downloaded = await downloadTheOfferSheet(page);
      expect(downloaded.languageAsked).toBe(language.tag);
      expect(downloaded.name).toBe(downloaded.nameTheApiGave);
      expect(downloaded.name.endsWith('.xlsx')).toBe(true);
      const rows = await rowsOfTheOfferSheet(downloaded.file);
      expect(rows.map((row) => row.partNumber).sort()).toEqual(
        [parts.changed.partNumber, parts.confirmed.partNumber].sort(),
      );

      // 2. The test changes one price, adds a row with a third made-up
      // Part's part number, and one with a part number nothing matches.
      const yes = yesIn(rows, parts.changed.partNumber);
      const unknown = {
        partNumber: aMadeUpPartNumber(),
        name: `Made-up requested PSU ${aWordUniqueToTheRun()}`,
      };
      const changed = await changedOfferSheet(downloaded.file, {
        change: [{ partNumber: parts.changed.partNumber, to: { usdPrice: 329.99 } }],
        add: [
          {
            partNumber: parts.added.partNumber,
            name: parts.added.name,
            usdPrice: 89.5,
            inStock: yes,
            warrantyMonths: 6,
          },
          { ...unknown, iqdPrice: 95_000, inStock: yes, warrantyMonths: 12 },
        ],
      });

      // 3. The Vendor uploads it. The result shows one Offer added, naming
      // its Part, one changed, one confirmed and one row skipped as no
      // Part, as the API answered.
      const chosen = { name: downloaded.name, file: changed };
      const result = await uploadAndApply(page, chosen);
      expect(result).toMatchObject({ rows: 4, changed: 1, confirmed: 1 });
      expect(result.added.map(({ part }) => part.id)).toEqual([parts.added.id]);
      expect(result.skipped).toMatchObject([
        { problem: 'noPart', partNumber: unknown.partNumber, name: unknown.name },
      ]);
      await expectTheCountsOf(page, result);
      // The screen's own count of the Offers the file would hold follows the
      // upload, which asked the Vendor's Offers again.
      await expect(page.getByTestId('offers-in-the-file')).toHaveAttribute(
        'data-count',
        '3',
      );
      await expect(theAddedRows(page)).toHaveCount(1);
      await expect(theAddedRows(page).getByTestId('part-name')).toHaveText(
        parts.added.name,
      );
      const skipped = theSkippedRow(page, result.skipped[0].row);
      await expect(skipped).toHaveAttribute('data-problem', 'noPart');
      await expect(skipped.getByTestId('part-number')).toHaveText(unknown.partNumber);
      await expect(skipped.getByTestId('row-name')).toHaveText(unknown.name);
      await expectNoSidewaysScroll(page);

      // 4. The Offers screen shows the new price and the new Offer, as the
      // API answers them.
      await goToTheSection(page, 'offers');
      const offers = await asTheAdmin(browser, (request, authorization) =>
        theVendorsOffers(request, authorization, vendor.vendorId),
      );
      const offerOfPart = (part: MadeUpPart) =>
        offers.find((offer) => offer.part.id === part.id);
      expect(offerOfPart(parts.changed)?.usdPrice).toBe('329.99');
      expect(offerOfPart(parts.added)).toMatchObject({
        usdPrice: '89.50',
        iqdPrice: null,
        inStock: true,
        warrantyMonths: 6,
      });
      await expect(
        rowOfOffer(page, parts.changed.name).getByTestId('usd-price'),
      ).toHaveText('329.99 $');
      await expect(rowOfOffer(page, parts.added.name).getByTestId('usd-price')).toHaveText(
        '89.50 $',
      );

      // 5. Back on the Offer sheet screen, the result is still there. The
      // Vendor turns the skipped row into a Part Request: the form is
      // filled from the row, the Vendor chooses a Category and sends it.
      // The row then says it was asked for, and the Vendor's Part Requests
      // lists the request.
      await goToTheOfferSheet(page);
      await expect(theResult(page)).toBeVisible();
      await askForItFrom(theSkippedRow(page, result.skipped[0].row)).click();
      await expect(page).toHaveURL(
        `${offerSheetUrl}/rows/${result.skipped[0].row}/part-request`,
      );
      await expectTheOfferSheetSectionCurrent(page);
      await expect(page.getByTestId('from-a-row')).toContainText(
        String(result.skipped[0].row),
      );
      await expect(partRequestField(page, 'name')).toHaveValue(unknown.name);
      await expect(partRequestField(page, 'partNumber')).toHaveValue(unknown.partNumber);
      await expect(partRequestField(page, 'usdPrice')).toHaveValue('');
      await expect(partRequestField(page, 'iqdPrice')).toHaveValue('95,000');
      await expect(partRequestField(page, 'warrantyMonths')).toHaveValue('12');
      await expect(partRequestField(page, 'category')).toHaveValue('');
      await expectNoSidewaysScroll(page);
      await partRequestField(page, 'category').selectOption('psu');
      await sendThePartRequest(page).click();

      await expect(page).toHaveURL(offerSheetUrl);
      const asked = theSkippedRow(page, result.skipped[0].row);
      await expect(asked.getByTestId('asked')).toBeVisible();
      await expect(askForItFrom(asked)).toHaveCount(0);
      const [sent] = await asTheAdmin(browser, (request, authorization) =>
        vendorsPartRequests(request, authorization, vendor.vendorId),
      );
      expect(sent).toMatchObject({
        category: 'psu',
        name: unknown.name,
        partNumber: unknown.partNumber,
        usdPrice: null,
        iqdPrice: 95_000,
        inStock: true,
        warrantyMonths: 12,
        state: 'open',
      });
      await goToThePartRequests(page);
      await expect(rowOfPartRequest(page, unknown.partNumber)).toBeVisible();

      // 6. The Admin fulfils the request, creating the Part. The Shopper's
      // page of that Part lists the Vendor's Offer at the row's price
      // (success criterion 10).
      const requested = await asTheAdmin(browser, async (request, authorization) => {
        const part = await createAMadeUpPart(request, authorization, {}, 'psu', {
          name: unknown.name,
          partNumber: unknown.partNumber,
        });
        expect(await fulfilAPartRequest(request, authorization, sent.id, part.id)).toBe(
          'created',
        );
        const visible = await theVisibleOffersOf(request, part.id);
        expect(visible.find((offer) => offer.vendor.id === vendor.vendorId)).toMatchObject({
          iqdPrice: 95_000,
        });
        return part;
      });
      await page.goto(addressIn(language, `/parts/${requested.id}`));
      await expect(offerOf(page, vendor.vendorId).getByTestId('shown-price')).toContainText(
        '95,000',
      );

      // 7. The same file uploaded again applies that row.
      await page.goto(offerSheetUrl);
      await expect(theOfferSheetScreen(page)).toBeVisible();
      const again = await uploadAndApply(page, chosen);
      expect(again).toMatchObject({
        rows: 4,
        added: [],
        changed: 0,
        confirmed: 4,
        skipped: [],
      });
      await expectTheCountsOf(page, again);
      await expect(theResult(page).getByTestId('skipped-group')).toHaveCount(0);
    });
  }
});

// A made-up Vendor with one Offer, and the file it downloaded, for the
// lines that need no more.
async function aVendorWithAnOffer(browser: Browser) {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  const part = await asTheAdmin(browser, async (request, authorization) => {
    const made = await createAMadeUpPart(request, authorization, {}, 'ram');
    await addAnOffer(request, authorization, vendor.vendorId, made.id, {
      usdPrice: '349.99',
    });
    return made;
  });
  return { vendor, part };
}

test.describe('a refusal, as a made-up Vendor with one Offer', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    ({ vendor, part } = await aVendorWithAnOffer(browser));
  });

  test('in English, the screen before an upload meets WCAG 2.2 level AA; a file that is not the layout is refused beside the field and changes nothing, and the screen with the refusal meets it too', async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    await openTheDashboardAs(page, vendor, offerSheetUrl);
    await chooseInThePortal(page, english);
    await expect(theOfferSheetScreen(page)).toBeVisible();
    await expect(theResult(page)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    // Uploading with no file chosen says so beside the field, and sends
    // nothing.
    await theUploadButton(page).click();
    await expect(theFileRefusal(page)).toHaveAttribute('data-reason', 'missing');

    const downloaded = await downloadTheOfferSheet(page);
    const notTheLayout = await changedOfferSheet(downloaded.file, {
      change: [{ partNumber: part.partNumber, to: { usdPrice: 1 } }],
      heading: { column: 1, to: `Made-up heading ${aWordUniqueToTheRun()}` },
    });
    const { status, body } = await uploadTheOfferSheet(page, {
      name: downloaded.name,
      file: notTheLayout,
    });
    expect(status).toBe(400);
    expect(body).toMatchObject({
      errors: [
        {
          code: 'NOT_VALID',
          additionalInformation: { field: 'offerSheet', reason: 'notTheLayout' },
        },
      ],
    });
    await expect(theFileRefusal(page)).toHaveAttribute('data-reason', 'notTheLayout');
    await expect(page.locator('#offer-sheet-file')).toHaveAttribute('aria-invalid', 'true');
    await expect(theResult(page)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    // The Offers screen is unchanged, as the API answers it.
    const offers = await asTheAdmin(browser, (request, authorization) =>
      theVendorsOffers(request, authorization, vendor.vendorId),
    );
    expect(offers.map(({ usdPrice }) => usdPrice)).toEqual(['349.99']);
    await goToTheSection(page, 'offers');
    await expect(rowOfOffer(page, part.name).getByTestId('usd-price')).toHaveText(
      '349.99 $',
    );
  });

  test('in Kurdish, a download the API cannot answer is said above its button, and the button waits while the file is on its way', async ({
    page,
  }) => {
    await openTheDashboardAs(page, vendor, offerSheetUrl);
    await chooseInThePortal(page, kurdish);
    await page.route(
      (url) => url.pathname === `/v1/vendors/${vendor.vendorId}/offer-sheet`,
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.abort();
      },
      { times: 1 },
    );
    await theDownloadButton(page).click();
    await expect(theDownloadButton(page)).toBeDisabled();
    await expect(page.getByTestId('download-refusal')).toBeVisible();
    await expect(theDownloadButton(page)).toBeEnabled();
    await expectNoSidewaysScroll(page);
  });
});

// A made-up Vendor whose file holds a row of every kind: one applied by the
// tie-break, one whose part number several Parts hold, two of the same
// Part, one that matched no Part and one with a cell that does not fit.
interface EveryKind {
  vendor: VendorLoginDetails;
  name: string;
  file: Buffer;
  tie: MadeUpPart;
  several: MadeUpPart[];
  same: MadeUpPart;
  unknown: { partNumber: string; name: string };
}

async function aFileOfEveryKind(browser: Browser): Promise<EveryKind> {
  const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
  const made = await asTheAdmin(browser, async (request, authorization) => {
    const tie = await createAMadeUpPart(request, authorization, {}, 'gpu');
    // A second Part that holds the first's part number, which the Vendor
    // does not offer.
    await createAMadeUpPart(request, authorization, {}, 'gpu', {
      partNumber: tie.partNumber,
    });
    const shared = `SHARED-${aWordUniqueToTheRun()}`;
    const several = [
      await createAMadeUpPart(request, authorization, {}, 'cpu', { partNumber: shared }),
      await createAMadeUpPart(request, authorization, {}, 'cpu', { partNumber: shared }),
    ];
    const same = await createAMadeUpPart(request, authorization, {}, 'case');
    const notValid = await createAMadeUpPart(request, authorization, {}, 'case');
    await addAnOffer(request, authorization, vendor.vendorId, tie.id, {
      usdPrice: '499.00',
    });
    return { tie, several, same, notValid };
  });

  // The file the Vendor downloads, made in the portal by the Vendor's own
  // Login, with the rows of every kind added below its one row.
  const context = await browser.newContext({
    javaScriptEnabled: true,
    viewport: narrowWindow,
    locale: arabicOfIraq,
  });
  try {
    const page = await context.newPage();
    await openTheDashboardAs(page, vendor, offerSheetUrl);
    const downloaded = await downloadTheOfferSheet(page);
    const rows = await rowsOfTheOfferSheet(downloaded.file);
    const yes = yesIn(rows, made.tie.partNumber);
    const unknown = {
      partNumber: aMadeUpPartNumber(),
      name: `کارتی گرافیکی داواکراوی تاقیکاری ${aWordUniqueToTheRun()}`,
    };
    const file = await changedOfferSheet(downloaded.file, {
      add: [
        { partNumber: made.several[0].partNumber, usdPrice: 210, inStock: yes },
        { partNumber: made.same.partNumber, usdPrice: 80, inStock: yes },
        { partNumber: made.same.partNumber, usdPrice: 85, inStock: yes },
        { ...unknown, iqdPrice: 125_000, inStock: yes },
        { partNumber: made.notValid.partNumber, usdPrice: 40, inStock: 'Made-up maybe' },
      ],
    });
    return {
      vendor,
      name: downloaded.name,
      file,
      tie: made.tie,
      several: made.several,
      same: made.same,
      unknown,
    };
  } finally {
    await context.close();
  }
}

// Opens the screen as the Vendor and uploads the file of every kind.
async function uploadEveryKind(page: Page, every: EveryKind): Promise<OfferSheetResult> {
  await openTheDashboardAs(page, every.vendor, offerSheetUrl);
  return uploadAndApply(page, { name: every.name, file: every.file });
}

test.describe('a result of every kind, as a made-up Vendor', () => {
  let every: EveryKind;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
    every = await aFileOfEveryKind(browser);
  });

  test('in English, several Parts and the same Part twice are each reported by their row numbers, as the API answered; the several Parts lead to the catalog search with their part number; and the result meets WCAG 2.2 level AA', async ({
    page,
  }) => {
    await openTheDashboardAs(page, every.vendor, offerSheetUrl);
    await chooseInThePortal(page, english);
    const result = await uploadAndApply(page, { name: every.name, file: every.file });
    expect(result.rows).toBe(6);
    expect(result.matchedByYourOffer).toMatchObject([
      { row: 2, part: { id: every.tie.id } },
    ]);
    expect(result.skipped.map(({ row, problem }) => [row, problem])).toEqual([
      [3, 'severalParts'],
      [4, 'samePart'],
      [5, 'samePart'],
      [6, 'noPart'],
      [7, 'notValid'],
    ]);
    await expectTheCountsOf(page, result);

    await expect(theRowsMatchedByYourOffer(page).getByTestId('part-name')).toHaveText(
      every.tie.name,
    );
    const several = theSkippedRow(page, 3);
    await expect(several).toHaveAttribute('data-problem', 'severalParts');
    await expect(several).toHaveAttribute('data-part-count', '2');
    await expect(several.getByTestId('part-name')).toHaveText(
      every.several.map(({ name }) => name).sort(),
    );
    for (const [row, other] of [
      [4, 5],
      [5, 4],
    ]) {
      const same = theSkippedRow(page, row);
      await expect(same).toHaveAttribute('data-problem', 'samePart');
      await expect(same.getByTestId('part-name')).toHaveText(every.same.name);
      await expect(same.getByTestId('other-rows')).toHaveAttribute(
        'data-rows',
        String(other),
      );
    }
    await expect(theSkippedRow(page, 6).getByTestId('row-name')).toHaveText(
      every.unknown.name,
    );
    const notValid = theSkippedRow(page, 7);
    await expect(notValid.getByTestId('cell')).toHaveAttribute('data-field', 'inStock');
    await expect(notValid.getByTestId('cell')).toHaveAttribute('data-reason', 'notYesOrNo');
    for (const problem of ['noPart', 'severalParts', 'samePart', 'notValid'] as const) {
      await expect(theSkippedGroup(page, problem)).toBeVisible();
    }
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    const shared = every.several[0].partNumber;
    await several.getByTestId('search-the-catalog').click();
    await expect(page).toHaveURL(
      (url) => url.pathname === '/add' && url.searchParams.get('search') === shared,
    );
    await expect(theCatalogSearch(page).getByRole('searchbox')).toHaveValue(shared);
    await expect(page.getByTestId('found-part').getByTestId('part-name')).toHaveText(
      every.several.map(({ name }) => name).sort(),
    );
  });

  test('the result is right to left in Kurdish and Arabic, with Western digits only, each part number shown as written and left to right, and the same rows in every language', async ({
    page,
  }) => {
    const result = await uploadEveryKind(page, every);
    // The skipped rows as the screen groups them, by problem, each group by
    // row number.
    const shown = (['noPart', 'severalParts', 'samePart', 'notValid'] as const).flatMap(
      (problem) =>
        result.skipped
          .filter((row) => row.problem === problem)
          .map(({ row }) => String(row)),
    );
    const read = await readInEveryLanguageOfTheVendorPortal(page, async () => {
      await expect(theResult(page)).toBeVisible();
      const partNumber = theSkippedRow(page, 6).getByTestId('part-number');
      const name = theSkippedRow(page, 6).getByTestId('row-name');
      return {
        rows: await theResult(page).getAttribute('data-rows'),
        skipped: await theResult(page)
          .getByTestId('skipped-row')
          .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-row'))),
        numbers: await theResult(page)
          .getByTestId('skipped-row')
          .getByTestId('row-number')
          .allTextContents(),
        partNumber: await partNumber.textContent(),
        partNumberLaidOut: await layoutOf(partNumber),
        name: await name.textContent(),
        nameLaidOut: await layoutOf(name),
      };
    });

    expectTheSameInEveryLanguage(
      new Map([...read].map(([language, each]) => [language, { ...each, numbers: [] }])),
    );
    for (const [, each] of read) {
      // The row's number is written in Western digits in every language.
      expect(each.numbers.map((text) => /\d+/.exec(text)?.[0])).toEqual(shown);
    }
    expect(read.get(english)).toMatchObject({
      rows: String(result.rows),
      skipped: shown,
      partNumber: every.unknown.partNumber,
      partNumberLaidOut: { direction: 'ltr', keptApart: true },
      name: every.unknown.name,
      nameLaidOut: { direction: 'rtl', keptApart: true },
    });
  });

  test('in Arabic, the Part Request form started from a row that matched no Part says a refusal beside the Category, meets WCAG 2.2 level AA, and leads back to the result kept', async ({
    page,
  }) => {
    await uploadEveryKind(page, every);
    await askForItFrom(theSkippedRow(page, 6)).click();
    await expect(page).toHaveURL(`${offerSheetUrl}/rows/6/part-request`);
    await expect(thePartRequestForm(page)).toBeVisible();
    await expect(partRequestField(page, 'name')).toHaveValue(every.unknown.name);
    await expect(partRequestField(page, 'iqdPrice')).toHaveValue('125,000');
    await sendThePartRequest(page).click();
    await expect(refusalOf(page, 'category')).toBeVisible();
    await expect(partRequestField(page, 'category')).toBeFocused();
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    // The form's way back, above its title, leads to the result.
    await page.locator('main a[href$="/offer-sheet"]').click();
    await expect(page).toHaveURL(offerSheetUrl);
    await expect(theSkippedRow(page, 6)).toBeVisible();
    await expect(askForItFrom(theSkippedRow(page, 6))).toBeVisible();
  });
});

test.describe('two rows of one part number that matched no Part, as a made-up Vendor', () => {
  test('in English, a Part Request sent from one marks both as asked for, and neither offers a second request', async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    const { vendor, part } = await aVendorWithAnOffer(browser);
    await openTheDashboardAs(page, vendor, offerSheetUrl);
    await chooseInThePortal(page, english);
    const downloaded = await downloadTheOfferSheet(page);
    const yes = yesIn(await rowsOfTheOfferSheet(downloaded.file), part.partNumber);
    // One part number nothing matches, written in two rows, the second in
    // lower case, as the API matches whatever the case of its letters.
    const unknown = {
      partNumber: aMadeUpPartNumber(),
      name: `Made-up requested RAM ${aWordUniqueToTheRun()}`,
    };
    const file = await changedOfferSheet(downloaded.file, {
      add: [
        { ...unknown, iqdPrice: 95_000, inStock: yes },
        {
          ...unknown,
          partNumber: unknown.partNumber.toLowerCase(),
          iqdPrice: 97_000,
          inStock: yes,
        },
      ],
    });
    const result = await uploadAndApply(page, { name: downloaded.name, file });
    expect(result.skipped).toMatchObject([
      { row: 3, problem: 'noPart', partNumber: unknown.partNumber, partRequestOpen: false },
      {
        row: 4,
        problem: 'noPart',
        partNumber: unknown.partNumber.toLowerCase(),
        partRequestOpen: false,
      },
    ]);

    await askForItFrom(theSkippedRow(page, 3)).click();
    await partRequestField(page, 'category').selectOption('ram');
    await sendThePartRequest(page).click();

    await expect(page).toHaveURL(offerSheetUrl);
    for (const row of [3, 4]) {
      await expect(theSkippedRow(page, row).getByTestId('asked')).toBeVisible();
      await expect(askForItFrom(theSkippedRow(page, row))).toHaveCount(0);
    }
    const requests = await asTheAdmin(browser, (request, authorization) =>
      vendorsPartRequests(request, authorization, vendor.vendorId),
    );
    expect(requests.map(({ partNumber }) => partNumber)).toEqual([unknown.partNumber]);
  });
});

test.describe('the development Admin acting as a made-up Vendor', () => {
  let vendor: VendorLoginDetails;
  let part: MadeUpPart;

  test.beforeAll(async ({ browser }) => {
    ({ vendor, part } = await aVendorWithAnOffer(browser));
  });

  test("downloads and uploads the Vendor's Offer sheet under the band, and the Vendor's own portal then shows the change", async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    const portal = `${vendorPageUrl(vendor.vendorId)}/portal`;
    await logInToTheDashboard(page, undefined, `${portal}/offer-sheet`);
    await expect(page.getByTestId('acting-band')).toBeVisible();
    await expect(theOfferSheetScreen(page)).toBeVisible();
    await expectTheOfferSheetSectionCurrent(page);

    const downloaded = await downloadTheOfferSheet(page);
    const file = await changedOfferSheet(downloaded.file, {
      change: [{ partNumber: part.partNumber, to: { usdPrice: 312.5 } }],
    });
    const result = await uploadAndApply(page, { name: downloaded.name, file });
    expect(result).toMatchObject({ rows: 1, changed: 1, confirmed: 0, skipped: [] });
    await expectTheCountsOf(page, result);
    await expect(page).toHaveURL(`${portal}/offer-sheet`);
    await expect(page.getByTestId('acting-band')).toBeVisible();

    const vendorsOwn = await browser.newContext({
      javaScriptEnabled: true,
      viewport: narrowWindow,
      locale: arabicOfIraq,
    });
    try {
      const vendorsPage = await vendorsOwn.newPage();
      await openTheDashboardAs(vendorsPage, vendor);
      await expect(rowOfOffer(vendorsPage, part.name).getByTestId('usd-price')).toHaveText(
        '312.50 $',
      );
    } finally {
      await vendorsOwn.close();
    }
  });
});

test.describe('the way to the screen, as a made-up Vendor', () => {
  test('the Offers screen leads to the Offer sheet from its count line, and from its empty state', async ({
    page,
    browser,
  }) => {
    const vendor = await aMadeUpVendorThatHasLoggedIn(browser);
    await openTheDashboardAs(page, vendor);
    await page.getByTestId('fill-in-an-offer-sheet').click();
    await expect(page).toHaveURL(offerSheetUrl);
    await expect(theOfferSheetScreen(page)).toBeVisible();
    await expect(page.getByTestId('offers-in-the-file')).toHaveAttribute('data-count', '0');

    const part = await asTheAdmin(browser, async (request, authorization) => {
      const made = await createAMadeUpPart(request, authorization, {}, 'storage');
      await addAnOffer(request, authorization, vendor.vendorId, made.id);
      return made;
    });
    await goToTheSection(page, 'offers');
    await expect(rowOfOffer(page, part.name)).toBeVisible();
    await page.getByTestId('to-offer-sheet').click();
    await expect(page).toHaveURL(offerSheetUrl);
    await expect(page.getByTestId('offers-in-the-file')).toHaveAttribute('data-count', '1');
    await expectNoSidewaysScroll(page);
  });
});

test.describe('the motion of an upload, as a made-up Vendor', () => {
  let every: EveryKind;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
    every = await aFileOfEveryKind(browser);
    // Eleven more rows that match no Part, so that the group of rows that
    // matched no Part shows its first ten and then more.
    every.file = await changedOfferSheet(every.file, {
      add: Array.from({ length: 11 }, (_, index) => ({
        partNumber: aMadeUpPartNumber(),
        name: `Made-up requested fan ${index + 1}`,
        usdPrice: 9 + index,
        inStock: true,
      })),
    });
  });

  // What a frame shows: the busy mark's turn, in degrees, the result's
  // height and how opaque it is, where "What the file holds" is drawn in
  // the page's own coordinates (below the result on a phone), the block
  // "Show 50 more" opens, its height and how opaque it is, and where the
  // group after it is drawn.
  interface Drawn {
    turn: number | null;
    result: number | null;
    opacity: number | null;
    panel: number | null;
    more: number | null;
    moreOpacity: number | null;
    after: number | null;
  }

  function look(): Drawn {
    const opacityOf = (element: Element | null) => {
      let opacity = 1;
      for (let at = element; at !== null && at !== document.body; at = at.parentElement) {
        opacity *= Number(getComputedStyle(at).opacity);
      }
      return opacity;
    };
    const top = (element: Element | null) =>
      element === null ? null : element.getBoundingClientRect().top + window.scrollY;
    const mark = document.querySelector('[data-testid="upload-offer-sheet"] svg');
    const transform = mark === null ? 'none' : getComputedStyle(mark).transform;
    const matrix = /^matrix\(([^,]+), ([^,]+)/.exec(transform);
    const result = document.querySelector('[data-testid="upload-result"]');
    const more = document.querySelector('[data-testid="more-rows"]');
    const after = document.querySelector(
      '[data-testid="skipped-group"][data-problem="severalParts"]',
    );
    return {
      turn:
        matrix === null
          ? null
          : (Math.atan2(Number(matrix[2]), Number(matrix[1])) * 180) / Math.PI,
      result: result === null ? null : result.getBoundingClientRect().height,
      opacity: result === null ? null : opacityOf(result),
      panel: top(document.querySelector('[data-testid="what-the-file-holds"]')),
      more: more === null ? null : more.getBoundingClientRect().height,
      moreOpacity: more === null ? null : opacityOf(more),
      after: top(after),
    };
  }

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`the busy mark turns while the file is on its way, the result's space opens and it fades in, and "Show 50 more" opens one block, with nothing below moving in one frame, ${reducedMotion} motion`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.emulateMedia({ reducedMotion });
      await openTheDashboardAs(page, every.vendor, offerSheetUrl);
      await chooseTheFile(page, { name: every.name, file: every.file });
      await page.route(
        (url) => url.pathname === `/v1/vendors/${every.vendor.vendorId}/offer-sheet`,
        async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await route.fallback();
        },
        { times: 1 },
      );

      const arriving = await film<Drawn>(
        page,
        look,
        async () => {
          await theUploadButton(page).click();
          await expect(theResult(page)).toBeVisible({ timeout: 15_000 });
        },
        { forMs: 2400 },
      );

      const turns = new Set(
        arriving
          .map(({ drawn }) => drawn.turn)
          .filter((turn): turn is number => turn !== null)
          .map((turn) => Math.round(turn)),
      );
      if (reducedMotion === 'reduce') {
        expect(turns.size, 'the busy mark stays still').toBeLessThanOrEqual(1);
      } else {
        expect(turns.size, 'the busy mark turns over several frames').toBeGreaterThan(3);
      }
      const opened = arriving.at(-1)?.drawn.result ?? 0;
      const opening = arriving.filter(
        ({ drawn }) =>
          drawn.result !== null && drawn.result > 1 && drawn.result < opened - 1,
      );
      expect(
        opening.length,
        "the result's space opens over several frames",
      ).toBeGreaterThan(2);
      const fading = arriving.filter(
        ({ drawn }) =>
          drawn.opacity !== null && drawn.opacity > 0.05 && drawn.opacity < 0.95,
      );
      expect(fading.length, 'the result fades in over several frames').toBeGreaterThan(2);
      // The panel below the result moves down as the result's space opens,
      // over the theme's 200 ms whatever the result's height: on a phone a
      // result of every kind is thousands of pixels tall. Each movement is
      // judged against its own size (`snapsOf`), so the speed guard, made for
      // a space of 300 pixels, is scaled to the space that opens.
      expect(
        snapsOf(
          'What the file holds',
          arriving.map(({ at, drawn }) => ({ at, value: drawn.panel })),
          { fastest: fastestSmooth * Math.max(1, opened / 300) },
        ),
      ).toEqual([]);
      await expect(theResult(page).getByRole('heading').first()).toBeFocused();

      await page.addStyleTag({ content: '* { overflow-anchor: none }' });
      const more = await film<Drawn>(
        page,
        look,
        async () => {
          await theSkippedGroup(page, 'noPart').getByTestId('show-more').click();
        },
        { forMs: 1600 },
      );
      const block = more.at(-1)?.drawn.more ?? 0;
      expect(block).toBeGreaterThan(0);
      expect(
        more.filter(
          ({ drawn }) => drawn.more !== null && drawn.more > 1 && drawn.more < block - 1,
        ).length,
        "the block's space opens over several frames",
      ).toBeGreaterThan(2);
      expect(
        more.filter(
          ({ drawn }) =>
            drawn.moreOpacity !== null &&
            drawn.moreOpacity > 0.05 &&
            drawn.moreOpacity < 0.95,
        ).length,
        'the block fades in over several frames',
      ).toBeGreaterThan(2);
      expect(
        snapsOf(
          'the group after it',
          more.map(({ at, drawn }) => ({ at, value: drawn.after })),
        ),
      ).toEqual([]);
      await expect(theSkippedGroup(page, 'noPart').getByTestId('skipped-row')).toHaveCount(
        12,
      );
      await expectNoSidewaysScroll(page);
    });
  }
});
