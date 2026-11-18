import { randomUUID } from 'node:crypto';

import {
  expectErrorResponse,
  type ExpectedErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';
import { languages } from '@pcp/i18n';
import sharp from 'sharp';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';
import { emptyTheRealm } from '../../../test-utils/keycloak/keycloak-administrator';
import {
  anArchiveOf,
  anOfferSheet,
  aRowOfText,
  aWorkbookAround,
  aWorksheet,
  aWorksheetOfAGibibyte,
  type CellWritten,
  deflatedPart,
  headingsIn,
  type ListedOfferBody,
  type MadeUpVendor,
  type OfferSheetResultBody,
  thePlatformUnderTest,
  wordsIn,
} from './offer-sheet-uploads';

// Reading an uploaded Offer sheet (SHT-2, SHT-7): the refusals of a whole
// file, which change no Offer, in their order; the layout recognised by its
// headings in any of the three languages; the rows and every cell read as
// the sheet module's spec's "Reading an upload" says; a row's one problem;
// a crafted file refused, or read, without taking the API down; and who may
// upload. Each test builds its file in memory, with the library the API
// reads it with or, for a file the library would not write, part by part.

// The refusals these tests expect, each as a whole.
function refusal(code: string): ExpectedErrorResponse[] {
  const key = code.toLowerCase();
  return [{ code, title: `${key}_title`, detail: `${key}_details` }];
}
const vendorNotFound = refusal('VENDOR_NOT_FOUND');
const vendorAccessDenied = refusal('VENDOR_ACCESS_DENIED');
const vendorDeactivated = refusal('VENDOR_DEACTIVATED');

// A refusal of the whole file, naming `offerSheet` and why.
function fileRefused(reason: string): ExpectedErrorResponse[] {
  return [notValid('offerSheet', { reason })];
}

// A moment for the API's clock, and a day before it.
const theUpload = new Date('2027-03-14T09:26:53.589Z');
const aDayBefore = new Date(theUpload.getTime() - 24 * 60 * 60 * 1000);

const { yes, no } = wordsIn('en');

// What the API's process holds in memory while it answers, which a test
// sees because the API under test runs in the test's own process: how much
// more it held at its peak, sampled every few milliseconds, than before.
async function whileWatchingTheMemory<T>(
  answer: () => Promise<T>,
): Promise<{ answered: T; grewBy: number }> {
  const before = process.memoryUsage().rss;
  let peak = before;
  const watching = setInterval(() => {
    peak = Math.max(peak, process.memoryUsage().rss);
  }, 5);
  try {
    const answered = await answer();
    peak = Math.max(peak, process.memoryUsage().rss);
    return { answered, grewBy: peak - before };
  } finally {
    clearInterval(watching);
  }
}

// A quarter of a gibibyte, far below what unpacking a crafted file holds.
const aQuarterOfAGibibyte = 256 * 1024 * 1024;

// A made-up Part's part number and a row that applies to it.
const partNumber = 'MU-READ-1';
const aRow = [partNumber, 'Made-up Radeon RX 9070 XT', 649.99, 950000, yes, 24];

describe('Reading an uploaded Offer sheet', () => {
  let testApp: TestAppWithLogins;
  let platform: ReturnType<typeof thePlatformUnderTest>;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    platform = thePlatformUnderTest(testApp);
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    letTheClockRun();
    await emptyTheDatabase();
    await emptyTheRealm();
  });

  // A Vendor with an Offer for the made-up Part, confirmed a day before the
  // upload, and its Offers as read at the upload's moment, where the clock
  // stays: what a refused file must leave as it was.
  async function aVendorWithAnOffer(): Promise<{
    vendor: MadeUpVendor;
    offers: ListedOfferBody[];
  }> {
    const vendor = await platform.aVendor();
    const part = await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);
    moveTheClockTo(aDayBefore);
    await platform.anOffer(vendor.id, part.id, { usdPrice: '599.00' });
    moveTheClockTo(theUpload);
    return { vendor, offers: (await platform.theVendorsOffers(vendor.id)).offers };
  }

  // The Admin's upload of a file for the Vendor.
  async function upload(vendorId: string, file: Buffer | null): Promise<Response> {
    return platform.upload(vendorId, file, await platform.adminToken());
  }

  describe("the whole file's refusals", () => {
    it('refuses a form with no file, and one whose file is under another name, as missing, changing no Offer', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const token = await platform.adminToken();

      await expectErrorResponse(
        await platform.upload(vendor.id, null, token),
        400,
        fileRefused('missing'),
      );
      await expectErrorResponse(
        await platform.upload(vendor.id, await anOfferSheet([aRow]), token, 'sheet'),
        400,
        fileRefused('missing'),
      );
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it('refuses a file over 5 MB as too large, before it reads it, changing no Offer', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();

      const response = await upload(vendor.id, Buffer.alloc(5 * 1024 * 1024 + 1, 1));

      await expectErrorResponse(response, 400, fileRefused('tooLarge'));
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it('refuses a file far over 5 MB in the same way, before it is all received', async () => {
      const { vendor } = await aVendorWithAnOffer();

      const response = await upload(vendor.id, Buffer.alloc(9 * 1024 * 1024, 1));

      await expectErrorResponse(response, 400, fileRefused('tooLarge'));
    });

    it('refuses as not readable a .csv, an old .xls, an .ods and a picture, changing no Offer', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const csv = Buffer.from(
        `${headingsIn('en').join(',')}\n${partNumber},Made-up,649.99,,${yes},\n`,
      );
      const xls = Buffer.concat([
        Buffer.from('d0cf11e0a1b11ae1', 'hex'),
        Buffer.alloc(4096),
      ]);
      const ods = anArchiveOf([
        {
          name: 'mimetype',
          data: Buffer.from('application/vnd.oasis.opendocument.spreadsheet'),
        },
        deflatedPart('content.xml', '<?xml version="1.0"?><office:document-content/>'),
      ]);
      const picture = await sharp({
        create: { width: 40, height: 30, channels: 3, background: '#aa3333' },
      })
        .png()
        .toBuffer();

      for (const file of [csv, xls, ods, picture]) {
        await expectErrorResponse(
          await upload(vendor.id, file),
          400,
          fileRefused('notReadable'),
        );
      }
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it('refuses as not the layout a file whose headings were moved, misspelt, left out or put on another row, changing no Offer', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const [partNumberHeading, name, usd, iqd, inStock, warranty] = headingsIn('en');

      const files = [
        // Two headings swapped.
        await anOfferSheet([aRow], [name, partNumberHeading, usd, iqd, inStock, warranty]),
        // One misspelt.
        await anOfferSheet(
          [aRow],
          [partNumberHeading, name, `${usd}s`, iqd, inStock, warranty],
        ),
        // One left out.
        await anOfferSheet([aRow], [partNumberHeading, name, usd, null, inStock, warranty]),
        // The headings on row 2, row 1 empty.
        await anOfferSheet([headingsIn('en'), aRow], []),
      ];

      for (const file of files) {
        await expectErrorResponse(
          await upload(vendor.id, file),
          400,
          fileRefused('notTheLayout'),
        );
      }
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it('refuses a file of more than 5,000 rows that are not empty as too many, after its layout, changing no Offer', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const rows = Array.from({ length: 5001 }, (_, index) => [
        `MU-MANY-${String(index)}`,
        null,
        100,
        null,
        yes,
        null,
      ]);
      const [first, ...others] = headingsIn('en');

      await expectErrorResponse(
        await upload(vendor.id, await anOfferSheet(rows)),
        400,
        fileRefused('tooManyRows'),
      );
      await expectErrorResponse(
        await upload(vendor.id, await anOfferSheet(rows, [`${first}!`, ...others])),
        400,
        fileRefused('notTheLayout'),
      );
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it('applies a file of exactly 5,000 rows, empty rows between them not counted', async () => {
      const vendor = await platform.aVendor();
      const parts = await platform.manyParts(5000, 'MU-LIMIT');
      const rows = parts.flatMap((part, index) => {
        const row = [part.partNumbers[0], null, 100 + index, null, yes, null];
        return index % 1000 === 0 ? [null, ['', '  ', null, null, null, null], row] : [row];
      });

      const result = await platform.uploaded(vendor.id, await anOfferSheet(rows));

      expect([result.rows, result.added.length, result.skipped]).toEqual([5000, 5000, []]);
      expect((await platform.theVendorsOffers(vendor.id)).count).toBe(5000);
    }, 120_000);
  });

  describe('a crafted file', () => {
    it('refuses as not readable, at once, a file of about a megabyte whose worksheet unpacks to a gibibyte, and the API still answers', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const file = anArchiveOf(
        aWorkbookAround(
          await aWorksheetOfAGibibyte(
            'xl/worksheets/sheet1.xml',
            aRowOfText(1, headingsIn('en')),
          ),
        ),
      );
      expect(file.length).toBeLessThan(2 * 1024 * 1024);

      const started = Date.now();
      const { answered, grewBy } = await whileWatchingTheMemory(() =>
        upload(vendor.id, file),
      );

      await expectErrorResponse(answered, 400, fileRefused('notReadable'));
      expect(Date.now() - started).toBeLessThan(5000);
      expect(grewBy).toBeLessThan(aQuarterOfAGibibyte);
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
      expect((await platform.downloaded(vendor.id, 'en')).length).toBeGreaterThan(0);
    }, 60_000);

    it('refuses it in the same way when the archive says the worksheet unpacks to 5,000 bytes', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const worksheet = await aWorksheetOfAGibibyte(
        'xl/worksheets/sheet1.xml',
        aRowOfText(1, headingsIn('en')),
      );
      const file = anArchiveOf(aWorkbookAround({ ...worksheet, declaredSize: 5000 }));

      const started = Date.now();
      const { answered, grewBy } = await whileWatchingTheMemory(() =>
        upload(vendor.id, file),
      );

      await expectErrorResponse(answered, 400, fileRefused('notReadable'));
      expect(Date.now() - started).toBeLessThan(5000);
      expect(grewBy).toBeLessThan(aQuarterOfAGibibyte);
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
      expect((await platform.downloaded(vendor.id, 'en')).length).toBeGreaterThan(0);
    }, 60_000);

    it('reads at once a file whose list "in stock" is chosen from covers the whole worksheet, and applies its rows', async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);
      const file = anArchiveOf(
        aWorkbookAround(
          deflatedPart(
            'xl/worksheets/sheet1.xml',
            aWorksheet(
              aRowOfText(1, headingsIn('en')) +
                aRowOfText(2, [partNumber, 'Made-up', '649.99', '', yes, '']),
              `<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="A1:XFD1048576"><formula1>"${yes},${no}"</formula1></dataValidation></dataValidations>`,
            ),
          ),
        ),
      );
      expect(file.length).toBeLessThan(8 * 1024);

      const started = Date.now();
      const result = await platform.uploaded(vendor.id, file);

      expect(Date.now() - started).toBeLessThan(5000);
      expect([result.rows, result.added.length]).toEqual([1, 1]);
      expect((await platform.downloaded(vendor.id, 'en')).length).toBeGreaterThan(0);
    });

    it('reads at once a file whose worksheet merges, sizes and names every cell, and applies its rows', async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);
      const file = anArchiveOf(
        aWorkbookAround(
          deflatedPart(
            'xl/worksheets/sheet1.xml',
            aWorksheet(
              aRowOfText(1, headingsIn('en')) +
                aRowOfText(2, [partNumber, 'Made-up', '649.99', '', yes, '']),
              '<cols><col min="1" max="2000000000" width="12" customWidth="1"/></cols>' +
                '<mergeCells count="1"><mergeCell ref="G1:XFD1048576"/></mergeCells>' +
                '<hyperlinks><hyperlink ref="A1:XFD1048576" display="everything"/></hyperlinks>' +
                '<conditionalFormatting sqref="A1:XFD1048576"><cfRule type="expression" priority="1"><formula>TRUE</formula></cfRule></conditionalFormatting>',
            ),
          ),
          '<definedNames><definedName name="everything">Offers!$A$1:$XFD$1048576</definedName><definedName name="_xlnm.Print_Area" localSheetId="0">Offers!$A$1:$XFD$1048576</definedName></definedNames>',
        ),
      );

      const started = Date.now();
      const result = await platform.uploaded(vendor.id, file);

      expect(Date.now() - started).toBeLessThan(5000);
      expect([result.rows, result.added.length]).toEqual([1, 1]);
      expect((await platform.downloaded(vendor.id, 'en')).length).toBeGreaterThan(0);
    });
  });

  describe("a result's size, which grows with its rows alone", () => {
    // The Admin's upload of a file, answered within 5 s with a result under
    // 5 MB, the process holding under a quarter of a gibibyte more at its
    // peak, and the API answering afterwards: the result as read.
    async function uploadedWithinBounds(
      vendorId: string,
      file: Buffer,
    ): Promise<OfferSheetResultBody> {
      const started = Date.now();
      const { answered, grewBy } = await whileWatchingTheMemory(async () => {
        const response = await upload(vendorId, file);
        return { status: response.status, text: await response.text() };
      });

      expect(answered.status).toBe(200);
      expect(Date.now() - started).toBeLessThan(5000);
      expect(answered.text.length).toBeLessThan(5 * 1024 * 1024);
      expect(grewBy).toBeLessThan(aQuarterOfAGibibyte);
      expect((await platform.downloaded(vendorId, 'en')).length).toBeGreaterThan(0);
      return JSON.parse(answered.text) as OfferSheetResultBody;
    }

    // A text of 32,767 characters, the most a cell of a spreadsheet holds,
    // which a file stores once among its shared strings however many cells
    // hold it.
    const theLongestCell = `Made-up ${'N'.repeat(32767 - 8)}`;

    it('answers 5,000 rows that all name one Part, each naming at most 10 others', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up One GPU', ['MU-ONE-1']);
      const file = await anOfferSheet(
        Array.from({ length: 5000 }, () => ['MU-ONE-1', null, 100, null, yes, null]),
      );

      const result = await uploadedWithinBounds(vendor.id, file);

      expect(result.skipped).toHaveLength(5000);
      expect(result.skipped[4999]).toEqual({
        row: 5001,
        partNumber: 'MU-ONE-1',
        problem: 'samePart',
        part,
        rows: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        otherRows: 4999,
      });
    }, 60_000);

    it('answers 5,000 rows whose part number is one cell of 32,767 characters, each giving it as written cut to 100 code points', async () => {
      const vendor = await platform.aVendor();
      const file = await anOfferSheet(
        Array.from({ length: 5000 }, () => [
          theLongestCell,
          theLongestCell,
          100,
          null,
          yes,
          null,
        ]),
      );
      expect(file.length).toBeLessThan(256 * 1024);

      const result = await uploadedWithinBounds(vendor.id, file);

      expect(result.skipped).toHaveLength(5000);
      expect(result.skipped[4999]).toEqual({
        row: 5001,
        partNumber: theLongestCell.slice(0, 100),
        problem: 'notValid',
        field: 'partNumber',
        reason: 'tooLong',
      });
    }, 60_000);

    it("answers 5,000 rows that matched no Part whose name is one cell of 32,767 characters, each carrying it cut to 300 code points, a Part Request's longest name", async () => {
      const vendor = await platform.aVendor();
      const file = await anOfferSheet(
        Array.from({ length: 5000 }, (_, index) => [
          `MU-NONE-${String(index)}`,
          theLongestCell,
          100,
          null,
          yes,
          null,
        ]),
      );

      const result = await uploadedWithinBounds(vendor.id, file);

      expect(result.skipped).toHaveLength(5000);
      expect(result.skipped[4999]).toEqual({
        row: 5001,
        partNumber: 'MU-NONE-4999',
        problem: 'noPart',
        name: theLongestCell.slice(0, 300),
        usdPrice: '100.00',
        iqdPrice: null,
        inStock: true,
        warrantyMonths: null,
        partRequestOpen: false,
      });
    }, 60_000);

    it('cuts a name and a part number by code points, never inside a character', async () => {
      const vendor = await platform.aVendor();
      // Each 𝔸 is one code point and two UTF-16 units.
      const name = '𝔸'.repeat(301);
      const partNumber = `${'𝔸'.repeat(101)}`;

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-NONE-1', name, 100, null, yes, null],
          [partNumber, null, 100, null, yes, null],
        ]),
      );

      expect(result.skipped.map((row) => row.name ?? row.partNumber)).toEqual([
        '𝔸'.repeat(300),
        '𝔸'.repeat(100),
      ]);
    });
  });

  describe('the headings', () => {
    it.each(languages)(
      'are taken in %s, with the yes and no of that language',
      async (language) => {
        const vendor = await platform.aVendor();
        await platform.aPart('Made-up In Stock GPU', ['MU-IN-1']);
        await platform.aPart('Made-up Out Of Stock GPU', ['MU-OUT-1']);
        const words = wordsIn(language);

        const result = await platform.uploaded(
          vendor.id,
          await anOfferSheet(
            [
              ['MU-IN-1', null, 100, null, words.yes, null],
              ['MU-OUT-1', null, 100, null, words.no, null],
            ],
            headingsIn(language),
          ),
        );

        expect([result.added.length, result.skipped]).toEqual([2, []]);
        const { offers } = await platform.theVendorsOffers(vendor.id);
        expect(
          offers.map((offer) => [offer.part.partNumbers[0], offer.inStock]).sort(),
        ).toEqual([
          ['MU-IN-1', true],
          ['MU-OUT-1', false],
        ]);
      },
    );

    it('are taken mixed from the three languages, with space around them and their case changed, and a column after F with notes is ignored', async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);
      const [ckb, ar, en] = [headingsIn('ckb'), headingsIn('ar'), headingsIn('en')];
      const headings = [
        `  ${en[0].toUpperCase()} `,
        ckb[1],
        ar[2],
        en[3].toLowerCase(),
        `${ckb[4]}\t`,
        ar[5],
        'My own notes',
      ];

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([[...aRow, 'Ask the supplier on Sunday']], headings),
      );

      expect([result.rows, result.added.length, result.skipped]).toEqual([1, 1, []]);
    });
  });

  describe('the rows', () => {
    it('passes over empty rows, a row of spaces and a row of notes after F alone, not counting them, and numbers each row by its row in the file', async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          null,
          aRow,
          ['   ', '', null, null, null, null],
          null,
          [null, null, null, null, null, null, 'A note after F'],
          ['MU-NO-SUCH-PART', 'Made-up', 'abc', null, yes, null],
        ]),
      );

      expect(result.rows).toBe(2);
      expect(result.added.map(({ row }) => row)).toEqual([3]);
      expect(result.skipped.map(({ row, field }) => ({ row, field }))).toEqual([
        { row: 7, field: 'usdPrice' },
      ]);
    });
  });

  describe('the cells', () => {
    it('reads Arabic-Indic and Eastern Arabic-Indic digits and the Arabic decimal separator in text, in prices, the warranty and part numbers', async () => {
      const vendor = await platform.aVendor();
      const arabic = await platform.aPart('Made-up Arabic GPU', ['MU-0042']);
      const eastern = await platform.aPart('Made-up Eastern GPU', ['MU-0043']);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-٠٠٤٢', null, '٣٤٩٫٩٩', '١٬٨٧٥٬٠٠٠', yes, '٢٤'],
          ['MU-۰۰۴۳', null, '۳۴۹٫۹۹', '۱۸۷۵۰۰۰', yes, '۲۴'],
        ]),
      );

      expect(result.skipped).toEqual([]);
      for (const part of [arabic, eastern]) {
        expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
          usdPrice: '349.99',
          iqdPrice: 1875000,
          warrantyMonths: 24,
        });
      }
    });

    it('drops thousands separators in a typed price, and reads a USD number cell of 349.99 as 349.99', async () => {
      const vendor = await platform.aVendor();
      const typed = await platform.aPart('Made-up Typed GPU', ['MU-TYPED-1']);
      const number = await platform.aPart('Made-up Number GPU', ['MU-NUMBER-1']);

      await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['MU-TYPED-1', null, '1,249.50', '1 875 000', yes, null],
          ['MU-NUMBER-1', null, 349.99, 1875000, yes, null],
        ]),
      );

      expect(await platform.theOfferOf(vendor.id, typed.id)).toMatchObject({
        usdPrice: '1249.50',
        iqdPrice: 1875000,
      });
      expect(await platform.theOfferOf(vendor.id, number.id)).toMatchObject({
        usdPrice: '349.99',
        iqdPrice: 1875000,
      });
    });

    it('reads in stock as yes or no in each language and in any case, and as TRUE or FALSE', async () => {
      const vendor = await platform.aVendor();
      const said = [
        [wordsIn('ckb').yes, true],
        [wordsIn('ar').no, false],
        [` ${yes.toUpperCase()} `, true],
        [no.toLowerCase(), false],
        [true, true],
        [false, false],
      ] as const;
      const parts = await Promise.all(
        said.map((_, index) =>
          platform.aPart(`Made-up Stock GPU ${String(index)}`, [
            `MU-STOCK-${String(index)}`,
          ]),
        ),
      );

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet(
          said.map(([word], index) => [
            `MU-STOCK-${String(index)}`,
            null,
            100,
            null,
            word,
            null,
          ]),
        ),
      );

      expect(result.skipped).toEqual([]);
      for (const [index, part] of parts.entries()) {
        expect((await platform.theOfferOf(vendor.id, part.id))?.inStock).toBe(
          said[index][1],
        );
      }
    });

    it('reads a formula by the value it was saved with, and refuses an error cell and a formula saved with no value as not readable in their columns', async () => {
      const vendor = await platform.aVendor();
      const part = await platform.aPart('Made-up Formula GPU', ['MU-FORMULA-1']);

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          [
            { formula: 'CONCAT("MU-","FORMULA-1")', result: 'MU-FORMULA-1' },
            null,
            { formula: '300+49.99', result: 349.99 },
            null,
            { formula: 'IF(TRUE,"Yes","No")', result: yes },
            { formula: '12*2', result: 24 },
          ],
          ['MU-ERROR-1', null, { error: '#N/A' }, null, yes, null],
          ['MU-ERROR-2', null, 100, null, yes, { formula: 'A1' }],
          [{ error: '#REF!' }, null, 100, null, yes, null],
        ]),
      );

      expect(await platform.theOfferOf(vendor.id, part.id)).toMatchObject({
        usdPrice: '349.99',
        inStock: true,
        warrantyMonths: 24,
      });
      expect(result.skipped).toEqual([
        {
          row: 3,
          partNumber: 'MU-ERROR-1',
          problem: 'notValid',
          field: 'usdPrice',
          reason: 'notReadable',
        },
        {
          row: 4,
          partNumber: 'MU-ERROR-2',
          problem: 'notValid',
          field: 'warrantyMonths',
          reason: 'notReadable',
        },
        {
          row: 5,
          partNumber: '#REF!',
          problem: 'notValid',
          field: 'partNumber',
          reason: 'notReadable',
        },
      ]);
    });
  });

  describe('a row that is not valid', () => {
    it('is skipped with its first problem, for each reason, and leaves the Offer it names unchanged and unconfirmed', async () => {
      const { vendor, offers } = await aVendorWithAnOffer();
      const long = 'X'.repeat(101);
      const rows: [CellWritten[], string, string][] = [
        [[null, 'Made-up', 100, null, yes, null], 'partNumber', 'missing'],
        [['\u200B  \u200E', 'Made-up', 100, null, yes, null], 'partNumber', 'missing'],
        [[long, 'Made-up', 100, null, yes, null], 'partNumber', 'tooLong'],
        [[partNumber, null, null, null, yes, null], 'usdPrice', 'missing'],
        [[partNumber, null, 'abc', null, yes, null], 'usdPrice', 'notANumber'],
        [[partNumber, null, -5, null, yes, null], 'usdPrice', 'notPositive'],
        [[partNumber, null, 1.999, null, yes, null], 'usdPrice', 'tooManyDecimals'],
        [[partNumber, null, 100000.01, null, yes, null], 'usdPrice', 'tooLarge'],
        [[partNumber, null, null, 'abc', yes, null], 'iqdPrice', 'notANumber'],
        [[partNumber, null, null, 0, yes, null], 'iqdPrice', 'notPositive'],
        [[partNumber, null, null, 1500.5, yes, null], 'iqdPrice', 'tooManyDecimals'],
        [[partNumber, null, null, 150000001, yes, null], 'iqdPrice', 'tooLarge'],
        [[partNumber, null, 100, null, null, null], 'inStock', 'missing'],
        [[partNumber, null, 100, null, 'maybe', null], 'inStock', 'notYesOrNo'],
        [[partNumber, null, 100, null, 1, null], 'inStock', 'notYesOrNo'],
        [[partNumber, null, 100, null, yes, 'two years'], 'warrantyMonths', 'notANumber'],
        [[partNumber, null, 100, null, yes, 1.5], 'warrantyMonths', 'notWholeMonths'],
        [[partNumber, null, 100, null, yes, 0], 'warrantyMonths', 'notPositive'],
        [[partNumber, null, 100, null, yes, 121], 'warrantyMonths', 'tooLarge'],
      ];

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet(rows.map(([cells]) => cells)),
      );

      expect(
        result.skipped.map(({ row, field, reason }) => ({ row, field, reason })),
      ).toEqual(
        rows.map(([, field, reason], index) => ({ row: index + 2, field, reason })),
      );
      expect([result.added, result.changed, result.confirmed]).toEqual([[], 0, 0]);
      expect((await platform.theVendorsOffers(vendor.id)).offers).toEqual(offers);
    });

    it("names the first problem in the columns' order, a price that cannot be read before no price at all", async () => {
      const vendor = await platform.aVendor();

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          [partNumber, null, 'abc', null, 'maybe', 'two years'],
          [partNumber, null, null, { error: '#DIV/0!' }, yes, null],
          [partNumber, null, null, null, 'maybe', null],
          [partNumber, null, 100, 'abc', { error: '#N/A' }, null],
          [null, null, 'abc', null, 'maybe', null],
        ]),
      );

      expect(
        result.skipped.map(({ row, field, reason }) => ({ row, field, reason })),
      ).toEqual([
        { row: 2, field: 'usdPrice', reason: 'notANumber' },
        { row: 3, field: 'iqdPrice', reason: 'notReadable' },
        { row: 4, field: 'usdPrice', reason: 'missing' },
        { row: 5, field: 'iqdPrice', reason: 'notANumber' },
        { row: 6, field: 'partNumber', reason: 'missing' },
      ]);
    });

    it('gives the part number as cleaned when another cell is the problem, and as written, cut to 100 code points, when its own cell is', async () => {
      const vendor = await platform.aVendor();
      const long = `MU-${'٧'.repeat(100)}`;

      const result = await platform.uploaded(
        vendor.id,
        await anOfferSheet([
          ['\u200E  mu-\u0660\u0660\u0664\u0662\u200B ', null, 'abc', null, yes, null],
          [long, null, 100, null, yes, null],
          ['   ', null, 100, null, yes, null],
        ]),
      );

      expect(result.skipped.map(({ partNumber: written }) => written)).toEqual([
        'mu-0042',
        `MU-${'٧'.repeat(97)}`,
        '   ',
      ]);
    });
  });

  describe('who may upload', () => {
    it("refuses another Vendor's address 403 with VENDOR_ACCESS_DENIED, whether it exists or not, before the file is looked at", async () => {
      const vendor = await platform.aVendor();
      const other = await platform.aVendor('Made-up Other Corner');
      const token = await platform.tokenOfTheOwnLogin(vendor);

      for (const vendorId of [other.id, randomUUID()]) {
        await expectErrorResponse(
          await platform.upload(vendorId, await anOfferSheet([aRow]), token),
          403,
          vendorAccessDenied,
        );
        await expectErrorResponse(
          await platform.upload(vendorId, null, token),
          403,
          vendorAccessDenied,
        );
      }
    });

    it("refuses a Deactivated Vendor's own Login 403 with VENDOR_DEACTIVATED, while the Admin still uploads for it", async () => {
      const vendor = await platform.aVendor();
      await platform.aPart('Made-up Radeon RX 9070 XT', [partNumber]);
      await platform.admin('deactivate', vendor.id);

      await expectErrorResponse(
        await platform.upload(
          vendor.id,
          await anOfferSheet([aRow]),
          await platform.tokenOfTheOwnLogin(vendor),
        ),
        403,
        vendorDeactivated,
      );
      expect(
        (await platform.uploaded(vendor.id, await anOfferSheet([aRow]))).added,
      ).toHaveLength(1);
    });

    it('refuses a call without a token 401, and an unknown Vendor named by the Admin 404 with VENDOR_NOT_FOUND', async () => {
      await expectErrorResponse(
        await platform.upload(randomUUID(), await anOfferSheet([aRow]), null),
        401,
        unauthorized,
      );
      await expectErrorResponse(
        await upload(randomUUID(), await anOfferSheet([aRow])),
        404,
        vendorNotFound,
      );
    });
  });
});
