import { randomUUID } from 'node:crypto';

import {
  bearerHeader,
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';
import { dashboardMessages, type Language, languages } from '@pcp/i18n';
import {
  type Cell,
  ValueType,
  Workbook,
  type Worksheet,
  type WorksheetViewCommon,
  type WorksheetViewFrozen,
} from 'exceljs';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import {
  emptyTheRealm,
  loginsNamed,
} from '../../../test-utils/keycloak/keycloak-administrator';

// Downloading a Vendor's Offer sheet (SHT-1): an .xlsx file of every Offer of
// the Vendor, in the language asked for, for the Vendor's own Login or the
// Admin acting for any Vendor (ACC-6). Each test reads the file it downloads
// with the library the API writes it with, and compares its words with
// `@pcp/i18n`'s, never quoting one.

// A Vendor as the API answers its creation, as far as these tests read it.
type VendorBody = { id: string; name: string; loginPhoneNumber: { international: string } };

// A made-up Vendor, with the identifier of its own Login.
type MadeUpVendor = VendorBody & { loginId: string };

// A Part and an Offer as the API answers their creation, as far as these
// tests read them.
type PartBody = { id: string; name: string; partNumbers: string[] };
type OfferBody = { id: string };

// A cell of a downloaded file as these tests compare it: its kind, its value
// and, for a number, its number format. An empty cell is null.
type CellRead =
  | null
  | { text: string }
  | { number: number; format: string }
  | { boolean: boolean }
  | { other: string };

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const vendorNotFound = refusal('VENDOR_NOT_FOUND');
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');

// The file's type, an .xlsx workbook.
const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The file's words in each language, as `@pcp/i18n` holds them.
function wordsIn(language: Language) {
  return dashboardMessages[language].OfferSheetFile;
}

// The six headings in the columns' order, A to F (SHT-1).
function headingsIn(language: Language): string[] {
  const { headings } = wordsIn(language);
  return [
    headings.partNumber,
    headings.name,
    headings.usdPrice,
    headings.iqdPrice,
    headings.inStock,
    headings.warrantyMonths,
  ];
}

const adminLoginId = randomUUID();

// A moment for the API's clock. In Iraq, three hours ahead of UTC, it is
// already 01:30 on 15 March 2027, while it is still the 14th in UTC.
const theDownload = new Date('2027-03-14T22:30:00.000Z');
const theDayInIraq = '2027-03-15';

// A day of 24 hours, and a moment some time before another.
const aDay = 24 * 60 * 60 * 1000;
function before(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() - milliseconds);
}

describe("Downloading a Vendor's Offer sheet", () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    letTheClockRun();
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  // A token of the Admin's Login. Made when it is needed, so that it is
  // judged by the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ subject: adminLoginId, roles: ['admin'] });
  }

  // Made-up Vendors are numbered, so that each has a login phone number of
  // its own.
  let vendors = 0;

  // A made-up Vendor the Admin creates, with a Login of its own. It calls
  // Keycloak, so it runs with the clock running.
  async function aVendor(name = 'Made-up Computer Corner'): Promise<MadeUpVendor> {
    vendors += 1;
    const response = await fetch(`${testApp.baseUrl}/v1/vendors`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        city: 'erbil',
        address: 'Made-up Street, Erbil',
        phoneNumber: '066 223 4567',
        loginPhoneNumber: `0750 400 ${String(1000 + vendors)}`,
      }),
    });
    expect(response.status).toBe(201);
    const { vendor } = (await response.json()) as { vendor: VendorBody };
    const [login] = await loginsNamed(vendor.loginPhoneNumber.international);
    return { ...vendor, loginId: login.id };
  }

  // A token of the Vendor's own Login, as Keycloak issues it. Made when it is
  // needed, so that it is judged by the clock that is current then.
  function tokenOfTheOwnLogin(vendor: MadeUpVendor): Promise<string> {
    return testApp.tokenOf({
      subject: vendor.loginId,
      loginName: vendor.loginPhoneNumber.international,
      roles: ['vendor'],
    });
  }

  // The Admin deactivates a Vendor, which calls Keycloak, so it runs with the
  // clock running.
  async function deactivate(vendorId: string): Promise<void> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/deactivate`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A made-up Part the Admin adds to the catalog.
  async function aPart(
    name: string,
    partNumbers: string[],
    category = 'gpu',
  ): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ category, name, manufacturer: 'Made-up Parts', partNumbers }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as PartBody;
  }

  // The Admin adds an Offer for the Vendor at the time of the clock, with
  // the details given over the made-up ones.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = {},
  ): Promise<OfferBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, usdPrice: '349.99', inStock: true, ...details }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as OfferBody;
  }

  function download(
    vendorId: string,
    language: string | null,
    token: string | null,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const query =
      language === null ? '' : `?${new URLSearchParams({ language }).toString()}`;
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offer-sheet${query}`, {
      headers: { ...(token === null ? {} : bearerHeader(token)), ...headers },
    });
  }

  // The file a download answers, read as a workbook.
  async function workbookOf(response: Response): Promise<Workbook> {
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(xlsx);
    const workbook = new Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    return workbook;
  }

  // The Offer sheet of a Vendor in a language, as the Admin downloads it at
  // the time of the clock: its one worksheet.
  async function theOfferSheet(vendorId: string, language: Language): Promise<Worksheet> {
    const workbook = await workbookOf(
      await download(vendorId, language, await adminToken()),
    );
    expect(workbook.worksheets).toHaveLength(1);
    return workbook.worksheets[0];
  }

  // A cell as these tests compare it.
  function cellRead(cell: Cell): CellRead {
    switch (cell.type) {
      case ValueType.Null:
        return null;
      case ValueType.String:
        return { text: cell.value as string };
      case ValueType.Number:
        return { number: cell.value as number, format: cell.numFmt };
      case ValueType.Boolean:
        return { boolean: cell.value as boolean };
      default:
        return { other: String(cell.type) };
    }
  }

  // The six cells, A to F, of a row of the worksheet.
  function rowRead(worksheet: Worksheet, row: number): CellRead[] {
    return [1, 2, 3, 4, 5, 6].map((column) =>
      cellRead(worksheet.getRow(row).getCell(column)),
    );
  }

  // Every row below the headings, as written.
  function rowsBelowTheHeadings(worksheet: Worksheet): CellRead[][] {
    const rows: CellRead[][] = [];
    for (let row = 2; row <= worksheet.actualRowCount; row++) {
      rows.push(rowRead(worksheet, row));
    }
    return rows;
  }

  // The headings in row 1.
  function headingsRead(worksheet: Worksheet): CellRead[] {
    return rowRead(worksheet, 1);
  }

  // The file's name, as `Content-Disposition` gives it in its encoded form,
  // which keeps Kurdish and Arabic, and as the plain name beside it, which
  // older programs read and holds no letter outside ASCII.
  function namesOf(response: Response): { encoded: string; plain: string } {
    const disposition = response.headers.get('content-disposition') ?? '';
    expect(disposition.startsWith('attachment;')).toBe(true);
    const encoded = /filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1] ?? '';
    const plain = /filename="([^"]*)"/.exec(disposition)?.[1] ?? '';
    return { encoded: decodeURIComponent(encoded), plain };
  }

  describe('the file', () => {
    it("answers the Vendor's own Login 200 with an .xlsx file named with the file's word and the day in Iraq", async () => {
      const vendor = await aVendor();
      moveTheClockTo(theDownload);

      const response = await download(vendor.id, 'en', await tokenOfTheOwnLogin(vendor));

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe(xlsx);
      expect(namesOf(response)).toEqual({
        encoded: `${wordsIn('en').file} ${theDayInIraq}.xlsx`,
        plain: `${wordsIn('en').file} ${theDayInIraq}.xlsx`,
      });
      const workbook = await workbookOf(response);
      expect(workbook.worksheets.map((worksheet) => worksheet.name)).toEqual([
        wordsIn('en').worksheet,
      ]);
    });

    it("lets the dashboard, at another origin, read the file's name", async () => {
      const vendor = await aVendor();

      const response = await download(vendor.id, 'en', await tokenOfTheOwnLogin(vendor), {
        origin: 'http://localhost:3002',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe(
        'http://localhost:3002',
      );
      expect(
        (response.headers.get('access-control-expose-headers') ?? '')
          .split(',')
          .map((name) => name.trim().toLowerCase()),
      ).toContain('content-disposition');
    });

    it.each(languages)(
      'is in the language asked for, %s: the headings, the worksheet, the file and the yes and no',
      async (language) => {
        const vendor = await aVendor();
        const inStock = await aPart('Made-up In Stock GPU', ['MU-IN-1']);
        const outOfStock = await aPart('Made-up Out Of Stock GPU', ['MU-OUT-1']);
        await anOffer(vendor.id, inStock.id, { inStock: true });
        await anOffer(vendor.id, outOfStock.id, { inStock: false });
        moveTheClockTo(theDownload);

        const response = await download(
          vendor.id,
          language,
          await tokenOfTheOwnLogin(vendor),
        );
        const { encoded, plain } = namesOf(response);
        const worksheet = (await workbookOf(response)).worksheets[0];

        const words = wordsIn(language);
        expect(encoded).toBe(`${words.file} ${theDayInIraq}.xlsx`);
        // The plain name is the English one in every language.
        expect(plain).toBe(`${wordsIn('en').file} ${theDayInIraq}.xlsx`);
        expect(worksheet.name).toBe(words.worksheet);
        expect(headingsRead(worksheet)).toEqual(
          headingsIn(language).map((heading) => ({ text: heading })),
        );
        expect(worksheet.getCell('E2').value).toBe(words.yes);
        expect(worksheet.getCell('E3').value).toBe(words.no);
        expect(worksheet.getCell('E2').dataValidation).toMatchObject({
          type: 'list',
          formulae: [`"${words.yes},${words.no}"`],
          showErrorMessage: true,
        });
      },
    );

    it('reads right to left in Kurdish and Arabic and left to right in English, its first row frozen in each', async () => {
      const vendor = await aVendor();

      const views = Object.fromEntries(
        await Promise.all(
          languages.map(async (language) => {
            const [view] = (await theOfferSheet(vendor.id, language)).views as Partial<
              WorksheetViewCommon & WorksheetViewFrozen
            >[];
            return [
              language,
              { state: view.state, ySplit: view.ySplit, rightToLeft: view.rightToLeft },
            ];
          }),
        ),
      );

      expect(views).toEqual({
        ckb: { state: 'frozen', ySplit: 1, rightToLeft: true },
        ar: { state: 'frozen', ySplit: 1, rightToLeft: true },
        en: { state: 'frozen', ySplit: 1, rightToLeft: false },
      });
    });

    it('makes each column wide enough for its heading, in each language', async () => {
      const vendor = await aVendor();

      for (const language of languages) {
        const worksheet = await theOfferSheet(vendor.id, language);
        headingsIn(language).forEach((heading, index) => {
          expect(worksheet.getColumn(index + 1).width).toBeGreaterThanOrEqual(
            heading.length,
          );
        });
      }
    });

    it('holds the headings alone for a Vendor with no Offer', async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Other Corner');
      const part = await aPart('Made-up Lonely GPU', ['MU-LONE-1']);
      await anOffer(other.id, part.id);

      const worksheet = await theOfferSheet(vendor.id, 'en');

      expect(headingsRead(worksheet)).toEqual(
        headingsIn('en').map((heading) => ({ text: heading })),
      );
      expect(rowsBelowTheHeadings(worksheet)).toEqual([]);
    });
  });

  describe('the rows', () => {
    it('writes each cell as the layout says: the part number and the name as text, the prices and the warranty as numbers, in stock as a word chosen from a list', async () => {
      const vendor = await aVendor();
      const part = await aPart('Made-up Radeon RX 9070 XT', ['0012345']);
      await anOffer(vendor.id, part.id, {
        usdPrice: '349.99',
        iqdPrice: 1875000,
        inStock: true,
        warrantyMonths: 24,
      });

      const worksheet = await theOfferSheet(vendor.id, 'en');

      expect(rowsBelowTheHeadings(worksheet)).toEqual([
        [
          { text: '0012345' },
          { text: 'Made-up Radeon RX 9070 XT' },
          { number: 349.99, format: '0.00' },
          { number: 1875000, format: '0' },
          { text: wordsIn('en').yes },
          { number: 24, format: '0' },
        ],
      ]);
    });

    it('leaves a price not quoted and a warranty not stated empty, and writes a whole dollar price with two decimals', async () => {
      const vendor = await aVendor();
      const inDollars = await aPart('Made-up A Dollars Only GPU', ['MU-USD-1']);
      const inDinars = await aPart('Made-up B Dinars Only GPU', ['MU-IQD-1']);
      await anOffer(vendor.id, inDollars.id, { usdPrice: '350', inStock: false });
      await anOffer(vendor.id, inDinars.id, {
        usdPrice: null,
        iqdPrice: 550000,
        inStock: true,
        warrantyMonths: 6,
      });

      const worksheet = await theOfferSheet(vendor.id, 'en');

      expect(rowsBelowTheHeadings(worksheet)).toEqual([
        [
          { text: 'MU-USD-1' },
          { text: 'Made-up A Dollars Only GPU' },
          { number: 350, format: '0.00' },
          null,
          { text: wordsIn('en').no },
          null,
        ],
        [
          { text: 'MU-IQD-1' },
          { text: 'Made-up B Dinars Only GPU' },
          null,
          { number: 550000, format: '0' },
          { text: wordsIn('en').yes },
          { number: 6, format: '0' },
        ],
      ]);
    });

    it("offers the list of yes and no on every row, and on rows below the last, where a Vendor adds a Part's row", async () => {
      const vendor = await aVendor();
      const part = await aPart('Made-up Listed GPU', ['MU-LIST-1']);
      await anOffer(vendor.id, part.id);

      const worksheet = await theOfferSheet(vendor.id, 'ar');

      const list = {
        type: 'list',
        formulae: [`"${wordsIn('ar').yes},${wordsIn('ar').no}"`],
      };
      expect(worksheet.getCell('E2').dataValidation).toMatchObject(list);
      expect(worksheet.getCell('E3').dataValidation).toMatchObject(list);
      expect(worksheet.getCell('E5001').dataValidation).toMatchObject(list);
      expect(worksheet.getCell('E1').dataValidation).toBeUndefined();
      expect(worksheet.getCell('D2').dataValidation).toBeUndefined();
    });

    it("holds one row for each of the Vendor's Offers, Expired Offers among them, by Category in the catalog's order, then by the Part's name, then by the Offer's identifier", async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Other Corner');
      const psu = await aPart('Made-up A PSU', ['MU-PSU-1'], 'psu');
      const gpu = await aPart('Made-up B GPU', ['MU-GPU-1'], 'gpu');
      const laterCpu = await aPart('Made-up Z CPU', ['MU-CPU-Z'], 'cpu');
      const earlierCpu = await aPart('Made-up A CPU', ['MU-CPU-A'], 'cpu');
      const twinOne = await aPart('Made-up Twin Cooler', ['MU-TWIN-1'], 'cpuCooler');
      const twinTwo = await aPart('Made-up Twin Cooler', ['MU-TWIN-2'], 'cpuCooler');
      const notOffered = await aPart('Made-up Not Offered CPU', ['MU-CPU-N'], 'cpu');

      // An Offer confirmed 20 days before the download is an Expired Offer.
      moveTheClockTo(before(theDownload, 20 * aDay));
      await anOffer(vendor.id, gpu.id);
      moveTheClockTo(before(theDownload, aDay));
      await anOffer(vendor.id, psu.id);
      await anOffer(vendor.id, laterCpu.id);
      await anOffer(vendor.id, earlierCpu.id);
      const twinOffers = [
        await anOffer(vendor.id, twinOne.id),
        await anOffer(vendor.id, twinTwo.id),
      ];
      await anOffer(other.id, notOffered.id);
      moveTheClockTo(theDownload);

      const worksheet = await theOfferSheet(vendor.id, 'en');

      // The twins' Offers by their identifiers.
      const twinsInOrder =
        twinOffers[0].id < twinOffers[1].id
          ? ['MU-TWIN-1', 'MU-TWIN-2']
          : ['MU-TWIN-2', 'MU-TWIN-1'];
      expect(
        rowsBelowTheHeadings(worksheet).map(([partNumber, name]) => [partNumber, name]),
      ).toEqual([
        [{ text: 'MU-CPU-A' }, { text: 'Made-up A CPU' }],
        [{ text: 'MU-CPU-Z' }, { text: 'Made-up Z CPU' }],
        [{ text: twinsInOrder[0] }, { text: 'Made-up Twin Cooler' }],
        [{ text: twinsInOrder[1] }, { text: 'Made-up Twin Cooler' }],
        [{ text: 'MU-GPU-1' }, { text: 'Made-up B GPU' }],
        [{ text: 'MU-PSU-1' }, { text: 'Made-up A PSU' }],
      ]);
    });

    it("gives the Admin the same file as the Vendor's own Login", async () => {
      const vendor = await aVendor();
      const part = await aPart('Made-up Shared View GPU', ['MU-SAME-1']);
      await anOffer(vendor.id, part.id, { iqdPrice: 990000, warrantyMonths: 12 });

      const asTheVendor = (
        await workbookOf(await download(vendor.id, 'ckb', await tokenOfTheOwnLogin(vendor)))
      ).worksheets[0];
      const asTheAdmin = await theOfferSheet(vendor.id, 'ckb');

      expect(rowsBelowTheHeadings(asTheAdmin)).toHaveLength(1);
      expect(rowsBelowTheHeadings(asTheAdmin)).toEqual(rowsBelowTheHeadings(asTheVendor));
      expect(headingsRead(asTheAdmin)).toEqual(headingsRead(asTheVendor));
    });
  });

  describe('the part number a row is given', () => {
    it("is the Part's first part number that no other Part holds, compared whatever the case of its letters", async () => {
      const vendor = await aVendor();
      const offered = await aPart('Made-up Offered GPU', [
        'abc-100',
        'MU-OWN-1',
        'MU-OWN-2',
      ]);
      await aPart('Made-up Other GPU', ['ABC-100']);
      await anOffer(vendor.id, offered.id);

      const [[partNumber]] = rowsBelowTheHeadings(await theOfferSheet(vendor.id, 'en'));

      expect(partNumber).toEqual({ text: 'MU-OWN-1' });
    });

    it("is the Part's first when another Part holds each of its part numbers", async () => {
      const vendor = await aVendor();
      const offered = await aPart('Made-up Shared Numbers GPU', ['OC', 'MU-SHARED-2']);
      await aPart('Made-up First Holder GPU', ['oc']);
      await aPart('Made-up Second Holder GPU', ['MU-Shared-2', 'MU-HOLDER-OWN']);
      await anOffer(vendor.id, offered.id);

      const [[partNumber]] = rowsBelowTheHeadings(await theOfferSheet(vendor.id, 'en'));

      expect(partNumber).toEqual({ text: 'OC' });
    });

    it('is an empty cell for a Part that has none', async () => {
      const vendor = await aVendor();
      const offered = await aPart('Made-up Numberless GPU', []);
      await anOffer(vendor.id, offered.id);

      const [[partNumber, name]] = rowsBelowTheHeadings(
        await theOfferSheet(vendor.id, 'en'),
      );

      expect([partNumber, name]).toEqual([null, { text: 'Made-up Numberless GPU' }]);
    });

    it('is the one a Part holds alone, as the catalog keeps it, whether or not the Vendor offers the other Part', async () => {
      const vendor = await aVendor();
      const first = await aPart('Made-up First GPU', ['MU-SHARE', 'MU-FIRST']);
      const second = await aPart('Made-up Second GPU', ['mu-share', 'MU-SECOND']);
      await anOffer(vendor.id, first.id);
      await anOffer(vendor.id, second.id);

      const rows = rowsBelowTheHeadings(await theOfferSheet(vendor.id, 'en'));

      expect(rows.map(([partNumber]) => partNumber)).toEqual([
        { text: 'MU-FIRST' },
        { text: 'MU-SECOND' },
      ]);
    });
  });

  describe('who may download it, and the language', () => {
    it("refuses a Vendor's token at another Vendor's address 403 with VENDOR_ACCESS_DENIED, whether that Vendor exists or not, before it reads the language", async () => {
      const vendor = await aVendor();
      const other = await aVendor('Made-up Other Corner');
      const token = await tokenOfTheOwnLogin(vendor);

      await expectErrorResponse(
        await download(other.id, 'en', token),
        403,
        vendorAccessDenied,
      );
      await expectErrorResponse(
        await download(other.id, null, token),
        403,
        vendorAccessDenied,
      );
      await expectErrorResponse(
        await download(randomUUID(), 'en', token),
        403,
        vendorAccessDenied,
      );
    });

    it("refuses a Deactivated Vendor's own Login 403 with VENDOR_DEACTIVATED, while the Admin still downloads its Offer sheet", async () => {
      const vendor = await aVendor();
      const part = await aPart('Made-up Deactivated Vendor GPU', ['MU-DEACT-1']);
      await anOffer(vendor.id, part.id);
      await deactivate(vendor.id);

      await expectErrorResponse(
        await download(vendor.id, 'en', await tokenOfTheOwnLogin(vendor)),
        403,
        vendorDeactivated,
      );
      const rows = rowsBelowTheHeadings(await theOfferSheet(vendor.id, 'en'));
      expect(rows.map(([partNumber]) => partNumber)).toEqual([{ text: 'MU-DEACT-1' }]);
    });

    it('refuses no token 401, and an unknown Vendor 404 with VENDOR_NOT_FOUND for the Admin, before it reads the language', async () => {
      const vendor = await aVendor();

      await expectErrorResponse(await download(vendor.id, 'en', null), 401, unauthorized);
      await expectErrorResponse(
        await download(randomUUID(), 'en', await adminToken()),
        404,
        vendorNotFound,
      );
      await expectErrorResponse(
        await download(randomUUID(), null, await adminToken()),
        404,
        vendorNotFound,
      );
    });

    it('refuses a missing language 400, naming it as missing, and one not of the three, naming it as not in the set', async () => {
      const vendor = await aVendor();
      const token = await tokenOfTheOwnLogin(vendor);

      await expectErrorResponse(await download(vendor.id, null, token), 400, [
        notValid('language', { reason: 'missing' }),
      ]);
      await expectErrorResponse(await download(vendor.id, '', token), 400, [
        notValid('language', { reason: 'missing' }),
      ]);
      for (const language of ['fr', 'EN', 'ckb-IQ', 'ku']) {
        await expectErrorResponse(await download(vendor.id, language, token), 400, [
          notValid('language', { reason: 'notInTheSet' }),
        ]);
      }
    });
  });
});
