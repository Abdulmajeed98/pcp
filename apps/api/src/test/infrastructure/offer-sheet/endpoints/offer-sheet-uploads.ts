import { randomUUID } from 'node:crypto';
import { createDeflateRaw, crc32, deflateRawSync } from 'node:zlib';

import { bearerHeader } from '@pcp/core/test-utils';
import { dashboardMessages, type Language } from '@pcp/i18n';
import { type CellValue, Workbook } from 'exceljs';

import { TestAppWithLogins } from '../../../test-utils/create-test-app';
import { loginsNamed } from '../../../test-utils/keycloak/keycloak-administrator';

// What the tests of an Offer sheet's upload share: the files they send,
// built in memory, either with the library the API reads them with or, for
// a file the library would not write, part by part; and the calls they make
// to the platform, as the Admin, a Vendor's own Login or a Shopper would.
// Every word of the file is `@pcp/i18n`'s, never quoted.

// A Vendor as the API answers its creation, as far as these tests read it.
export type VendorBody = {
  id: string;
  name: string;
  loginPhoneNumber: { international: string };
};

// A made-up Vendor, with the identifier of its own Login.
export type MadeUpVendor = VendorBody & { loginId: string };

// A Part as the catalog's summary answers it.
export type PartBody = {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  photoPath: string | null;
};

// One of a Vendor's Offers, as its list answers it.
export type ListedOfferBody = {
  id: string;
  part: PartBody;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  createdAt: string;
  daysSinceConfirmation: number;
  expired: boolean;
};

// A Visible Offer, as a Part's list answers it to a Shopper.
export type VisibleOfferBody = {
  vendor: { id: string; name: string };
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
};

// A Part Request as it is sent and as the Vendor's list answers it.
export type PartRequestBody = {
  id: string;
  category: string;
  name: string;
  partNumber: string;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  state: 'open' | 'fulfilled' | 'rejected';
};

// A row an upload skipped, as its result answers it: each problem with the
// fields it holds, the others left out.
export type SkippedRowBody = {
  row: number;
  partNumber: string;
  problem: 'noPart' | 'severalParts' | 'samePart' | 'notValid';
  name?: string | null;
  usdPrice?: string | null;
  iqdPrice?: number | null;
  inStock?: boolean;
  warrantyMonths?: number | null;
  partRequestOpen?: boolean;
  parts?: PartBody[];
  partCount?: number;
  part?: PartBody;
  rows?: number[];
  otherRows?: number;
  field?: string;
  reason?: string;
};

// The upload's result, as the API answers it.
export type OfferSheetResultBody = {
  rows: number;
  added: { row: number; part: PartBody; offerId: string }[];
  changed: number;
  confirmed: number;
  matchedByYourOffer: { row: number; part: PartBody }[];
  skipped: SkippedRowBody[];
};

// The type of an .xlsx file.
export const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The file's words in each language, as `@pcp/i18n` holds them.
export function wordsIn(language: Language) {
  return dashboardMessages[language].OfferSheetFile;
}

// The six headings in the columns' order, A to F (SHT-1).
export function headingsIn(language: Language): string[] {
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

// A cell as a test writes it into a file with the library: text, a number,
// TRUE or FALSE, nothing, a formula with the value it was saved with, or an
// error.
export type CellWritten = CellValue;

// An Offer sheet as a Vendor's spreadsheet program could save it, made with
// the library: row 1 the headings given, English unless told, and the rows
// given below them from row 2, a row given as null left out, so that the
// rows after it keep their numbers.
export async function anOfferSheet(
  rows: readonly (readonly CellWritten[] | null)[],
  headings: readonly CellWritten[] = headingsIn('en'),
): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Offers');
  worksheet.getRow(1).values = [...headings];
  rows.forEach((cells, index) => {
    if (cells !== null) worksheet.getRow(index + 2).values = [...cells];
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// One part of an archive as a test writes it: its name, its bytes, whether
// they are deflated, and, for deflated bytes, the size and the checksum it
// says they unpack to, which a test may forge.
export type ArchivePart = {
  name: string;
  data: Buffer;
  compressed?: boolean;
  declaredSize?: number;
  crc?: number;
};

// A zip archive of the parts given, in order, each stored as it is or
// deflated, written byte by byte as the format lays it out, so that a test
// can make an archive no library would write: one whose sizes lie, say.
export function anArchiveOf(parts: readonly ArchivePart[]): Buffer {
  const pieces: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const part of parts) {
    const name = Buffer.from(part.name, 'utf8');
    const { data } = part;
    const method = part.compressed === true ? 8 : 0;
    const size = part.declaredSize ?? data.length;
    const crc = part.crc ?? crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    pieces.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const directoryBytes = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(parts.length, 8);
  end.writeUInt16LE(parts.length, 10);
  end.writeUInt32LE(directoryBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...pieces, directoryBytes, end]);
}

// A part of an archive, deflated, saying the size it truly unpacks to.
export function deflatedPart(name: string, text: string): ArchivePart {
  const data = Buffer.from(text, 'utf8');
  return {
    name,
    data: deflateRawSync(data),
    compressed: true,
    declaredSize: data.length,
    crc: crc32(data),
  };
}

const spreadsheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationshipsNamespace =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

// The parts of a workbook of one worksheet, written by hand, around the
// worksheet's own part: what the library reads to find a worksheet. The
// workbook holds the defined names given, if any.
export function aWorkbookAround(worksheet: ArchivePart, definedNames = ''): ArchivePart[] {
  return [
    deflatedPart(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    ),
    deflatedPart(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipsNamespace}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    deflatedPart(
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${spreadsheetNamespace}" xmlns:r="${relationshipsNamespace}"><sheets><sheet name="Offers" sheetId="1" r:id="rId1"/></sheets>${definedNames}</workbook>`,
    ),
    deflatedPart(
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipsNamespace}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    worksheet,
  ];
}

// A worksheet's XML around what is given: its cells, as `sheetData` holds
// them, and what follows them.
export function aWorksheet(cells: string, after = ''): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${spreadsheetNamespace}" xmlns:r="${relationshipsNamespace}"><sheetData>${cells}</sheetData>${after}</worksheet>`;
}

// A row of text cells written inline, as `sheetData` holds them, an empty
// text left out.
export function aRowOfText(row: number, texts: readonly string[]): string {
  const cells = texts.map((text, index) => {
    if (text === '') return '';
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<c r="${String.fromCharCode(65 + index)}${row}" t="inlineStr"><is><t>${escaped}</t></is></c>`;
  });
  return `<row r="${row}">${cells.join('')}</row>`;
}

// A worksheet's part that unpacks to more than a gibibyte, though its file
// is about one megabyte: its cells, then spaces between them and the
// worksheet's end, deflated as they are made, so that the test never holds
// them all.
export async function aWorksheetOfAGibibyte(
  name: string,
  cells: string,
): Promise<ArchivePart> {
  const [start, end] = aWorksheet(cells).split('</sheetData>');
  const deflate = createDeflateRaw({ level: 9 });
  const chunks: Buffer[] = [];
  deflate.on('data', (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise((resolve) => deflate.on('end', resolve));

  const spaces = Buffer.alloc(1024 * 1024, ' ');
  const last = Buffer.from(`</sheetData>${end}`);
  let crc = crc32(start);
  deflate.write(start);
  for (let mebibyte = 0; mebibyte < 1024; mebibyte++) {
    crc = crc32(spaces, crc);
    if (!deflate.write(spaces)) {
      await new Promise((resolve) => deflate.once('drain', resolve));
    }
  }
  deflate.end(last);
  await finished;

  return {
    name,
    data: Buffer.concat(chunks),
    compressed: true,
    declaredSize: Buffer.byteLength(start) + 1024 * spaces.length + last.length,
    crc: crc32(last, crc),
  };
}

// The calls the tests make to the platform under test.
export function thePlatformUnderTest(testApp: TestAppWithLogins) {
  const adminLoginId = randomUUID();
  // Made-up Vendors are numbered, so that each has a login phone number of
  // its own.
  let vendors = 0;

  // A token of the Admin's Login. Made when it is needed, so that it is
  // judged by the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ subject: adminLoginId, roles: ['admin'] });
  }

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

  // The Admin deactivates or reactivates a Vendor, which calls Keycloak, so
  // it runs with the clock running.
  async function admin(action: 'deactivate' | 'reactivate', vendorId: string) {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/${action}`, {
      method: 'POST',
      headers: bearerHeader(await adminToken()),
    });
    expect(response.status).toBe(200);
  }

  // A made-up Part the Admin adds to the catalog, a GPU unless told.
  async function aPart(
    name: string,
    partNumbers: readonly string[],
    category = 'gpu',
  ): Promise<PartBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ category, name, manufacturer: 'Made-up Parts', partNumbers }),
    });
    expect(response.status).toBe(201);
    const {
      id,
      manufacturer,
      photoPath,
      partNumbers: kept,
    } = (await response.json()) as PartBody;
    // As the catalog's summary answers it.
    return { id, category, name, manufacturer, partNumbers: kept, photoPath };
  }

  // As many made-up Parts as asked, each with a part number of its own made
  // from the prefix and its number, added a few at a time.
  async function manyParts(count: number, prefix: string): Promise<PartBody[]> {
    const token = await adminToken();
    const parts: PartBody[] = [];
    for (let first = 0; first < count; first += 25) {
      const added = await Promise.all(
        Array.from({ length: Math.min(25, count - first) }, async (_, index) => {
          const number = first + index;
          const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
            method: 'POST',
            headers: { ...bearerHeader(token), 'content-type': 'application/json' },
            body: JSON.stringify({
              category: 'gpu',
              name: `Made-up GPU ${String(number)}`,
              manufacturer: 'Made-up Parts',
              partNumbers: [`${prefix}-${String(number)}`],
            }),
          });
          expect(response.status).toBe(201);
          return (await response.json()) as PartBody;
        }),
      );
      parts.push(...added);
    }
    return parts;
  }

  // The Admin adds an Offer for the Vendor at the time of the clock, which
  // is then its Confirmation, with the details given over the made-up ones.
  async function anOffer(
    vendorId: string,
    partId: string,
    details: Record<string, unknown> = {},
  ): Promise<ListedOfferBody> {
    const response = await fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offers`, {
      method: 'POST',
      headers: { ...bearerHeader(await adminToken()), 'content-type': 'application/json' },
      body: JSON.stringify({ partId, usdPrice: '349.99', inStock: true, ...details }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as ListedOfferBody;
  }

  // An upload of a file as the form `offerSheet`, by the token given, or
  // with none for `null`.
  function upload(
    vendorId: string,
    file: Buffer | null,
    token: string | null,
    field = 'offerSheet',
  ): Promise<Response> {
    const form = new FormData();
    if (file !== null) {
      form.append(
        field,
        new Blob([new Uint8Array(file)], { type: xlsx }),
        'Offer sheet.xlsx',
      );
    }
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/offer-sheet`, {
      method: 'POST',
      headers: token === null ? {} : bearerHeader(token),
      body: form,
    });
  }

  // The result of the Admin's upload of a file for the Vendor at the time of
  // the clock.
  async function uploaded(vendorId: string, file: Buffer): Promise<OfferSheetResultBody> {
    const response = await upload(vendorId, file, await adminToken());
    expect(response.status).toBe(200);
    return (await response.json()) as OfferSheetResultBody;
  }

  // The Vendor's Offer sheet, as the Admin downloads it in a language.
  async function downloaded(vendorId: string, language: Language): Promise<Buffer> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/offer-sheet?language=${language}`,
      { headers: bearerHeader(await adminToken()) },
    );
    expect(response.status).toBe(200);
    return Buffer.from(await response.arrayBuffer());
  }

  // The Vendor's Offers, as the Admin reads them at the time of the clock,
  // and how many it has.
  async function theVendorsOffers(
    vendorId: string,
  ): Promise<{ offers: ListedOfferBody[]; count: number }> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/vendors/${vendorId}/offers?size=100`,
      { headers: bearerHeader(await adminToken()) },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      content: ListedOfferBody[];
      counts: { offers: number };
    };
    return { offers: body.content, count: body.counts.offers };
  }

  // The Vendor's Offer for the Part, as the Admin reads it at the time of
  // the clock, or undefined.
  async function theOfferOf(
    vendorId: string,
    partId: string,
  ): Promise<ListedOfferBody | undefined> {
    const { offers } = await theVendorsOffers(vendorId);
    return offers.find((offer) => offer.part.id === partId);
  }

  // A Part's Visible Offers, as a Shopper reads them without a token at the
  // time of the clock.
  async function theVisibleOffersOf(partId: string): Promise<VisibleOfferBody[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/parts/${partId}/offers?currency=USD`,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as VisibleOfferBody[];
  }

  // A Part Request sent for the Vendor, by the token given, the Admin's
  // unless told.
  async function sendAPartRequest(
    vendorId: string,
    request: Record<string, unknown>,
    token?: string,
  ): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/vendors/${vendorId}/part-requests`, {
      method: 'POST',
      headers: {
        ...bearerHeader(token ?? (await adminToken())),
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  }

  // A Part Request the Admin sends for the Vendor at the time of the clock.
  async function aPartRequest(
    vendorId: string,
    request: Record<string, unknown>,
  ): Promise<PartRequestBody> {
    const response = await sendAPartRequest(vendorId, request);
    expect(response.status).toBe(201);
    return (await response.json()) as PartRequestBody;
  }

  // The Admin fulfils or rejects a Part Request.
  async function resolve(
    partRequestId: string,
    resolution: { partId: string } | { reason: string },
  ): Promise<void> {
    const action = 'partId' in resolution ? 'fulfil' : 'reject';
    const response = await fetch(
      `${testApp.baseUrl}/v1/part-requests/${partRequestId}/${action}`,
      {
        method: 'POST',
        headers: {
          ...bearerHeader(await adminToken()),
          'content-type': 'application/json',
        },
        body: JSON.stringify(resolution),
      },
    );
    expect(response.status).toBe(200);
  }

  return {
    adminLoginId,
    adminToken,
    aVendor,
    tokenOfTheOwnLogin,
    admin,
    aPart,
    manyParts,
    anOffer,
    upload,
    uploaded,
    downloaded,
    theVendorsOffers,
    theOfferOf,
    theVisibleOffersOf,
    sendAPartRequest,
    aPartRequest,
    resolve,
  };
}
