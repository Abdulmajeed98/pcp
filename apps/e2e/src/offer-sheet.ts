import { readFile } from 'node:fs/promises';

import {
  type APIRequestContext,
  type Browser,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { type CellValue, Workbook, type Worksheet } from 'exceljs';

import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { closeTheMenu, openTheMenuOnAPhone } from './menu-sheet';
import { apiUrl } from './platform';

// The Vendor portal's Offer sheet: its screen, the file it downloads and
// uploads, read and changed with the library the API writes it with
// (ExcelJS), and the upload's result, found by test ids, by where links lead
// and by what the API answered, whatever language the portal is in. No word
// of the file or of the screen is quoted: a cell is found by its column, and
// a word such as the language's yes is copied from a cell the API wrote.

// Calls the API as the development Admin, in a browser of its own that is
// closed afterwards.
export async function asTheAdmin<Done>(
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

// ------------------------------------------------------------- the screen

// The portal's Offer sheet section: in the frame's sidebar from 64rem, and
// in the menu sheet on a phone.
export function thePortalsOfferSheetSection(page: Page): Locator {
  return page.getByTestId('portal-sections').locator('a[href$="/offer-sheet"]');
}

// Goes to the Offer sheet section, as a Vendor does: on a phone it opens the
// menu sheet, which choosing a section closes.
export async function goToTheOfferSheet(page: Page): Promise<void> {
  await openTheMenuOnAPhone(page);
  await thePortalsOfferSheetSection(page).click();
  await expect(theOfferSheetScreen(page)).toBeVisible();
}

// The section is marked as the one the Vendor is in, read in the menu sheet
// on a phone.
export async function expectTheOfferSheetSectionCurrent(page: Page): Promise<void> {
  const opened = await openTheMenuOnAPhone(page);
  await expect(thePortalsOfferSheetSection(page)).toHaveAttribute('aria-current', 'page');
  if (opened) await closeTheMenu(page);
}

// The Offer sheet screen.
export function theOfferSheetScreen(page: Page): Locator {
  return page.getByTestId('offer-sheet-screen');
}

// The screen's button that downloads the file.
export function theDownloadButton(page: Page): Locator {
  return page.getByTestId('download-offer-sheet');
}

// The screen's file field.
export function theFileField(page: Page): Locator {
  return page.locator('#offer-sheet-file');
}

// The screen's button that uploads the chosen file.
export function theUploadButton(page: Page): Locator {
  return page.getByTestId('upload-offer-sheet');
}

// What the screen says beside the file field when the file was refused.
export function theFileRefusal(page: Page): Locator {
  return page.getByTestId('file-refusal');
}

// ------------------------------------------------------------ the file

// A file as the screen gave it to the browser, and as the API named it.
export interface Downloaded {
  // The name the browser was told to save it under.
  name: string;
  // The name the API gave in its `Content-Disposition`, decoded.
  nameTheApiGave: string;
  // The language the screen asked the API for it in.
  languageAsked: string | null;
  file: Buffer;
}

// The file's name as an answer's `Content-Disposition` gives it: its
// `filename*`, percent-encoded as UTF-8, which keeps Kurdish and Arabic.
function nameIn(contentDisposition: string): string {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  if (encoded === undefined) throw new Error(`No filename* in "${contentDisposition}".`);
  return decodeURIComponent(encoded);
}

// Downloads the Offer sheet with the screen's button, as a Vendor does, and
// gives back the file the browser saved, with the API's answer beside it.
export async function downloadTheOfferSheet(page: Page): Promise<Downloaded> {
  const answered = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${apiUrl}/v1/vendors/`) &&
      new URL(response.url()).pathname.endsWith('/offer-sheet') &&
      response.request().method() === 'GET',
  );
  const downloading = page.waitForEvent('download');
  await theDownloadButton(page).click();
  const [response, download] = await Promise.all([answered, downloading]);
  expect(response.status()).toBe(200);
  const saved = await download.path();

  return {
    name: download.suggestedFilename(),
    nameTheApiGave: nameIn(response.headers()['content-disposition'] ?? ''),
    languageAsked: new URL(response.url()).searchParams.get('language'),
    file: await readFile(saved),
  };
}

// The six cells of a row of the Offer sheet, as the file holds them: the
// part number and the name as text, each price and the warranty as a number
// or empty, and "in stock" as the language's word.
export interface OfferSheetRow {
  partNumber: string | null;
  name: string | null;
  usdPrice: number | null;
  iqdPrice: number | null;
  inStock: string | null;
  warrantyMonths: number | null;
}

// A cell's value as a row's details: what it holds, or null when it is
// empty.
function valueOf(value: CellValue): string | number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}

// The rows of a file below its headings, in the file's order.
export async function rowsOfTheOfferSheet(file: Buffer): Promise<OfferSheetRow[]> {
  const worksheet = await theWorksheetOf(file);
  const rows: OfferSheetRow[] = [];
  for (let number = 2; number <= worksheet.rowCount; number++) {
    const cell = (column: number) =>
      valueOf(worksheet.getRow(number).getCell(column).value);
    rows.push({
      partNumber: cell(1) as string | null,
      name: cell(2) as string | null,
      usdPrice: cell(3) as number | null,
      iqdPrice: cell(4) as number | null,
      inStock: cell(5) as string | null,
      warrantyMonths: cell(6) as number | null,
    });
  }
  return rows;
}

async function theWorksheetOf(file: Buffer): Promise<Worksheet> {
  const workbook = new Workbook();
  await workbook.xlsx.load(file as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (worksheet === undefined) throw new Error('The file holds no worksheet.');
  return worksheet;
}

// A row a test adds or writes over: each cell as the test gives it, a
// detail left out empty, and "in stock" as a word or as TRUE or FALSE.
export type RowWritten = Partial<Omit<OfferSheetRow, 'inStock'>> & {
  inStock?: string | boolean | null;
};

// The layout's six columns, in their order.
const columns = [
  'partNumber',
  'name',
  'usdPrice',
  'iqdPrice',
  'inStock',
  'warrantyMonths',
] as const;

// The cells of a row, in the layout's order.
function cellsOf(row: RowWritten): CellValue[] {
  return columns.map((key) => row[key] ?? null);
}

// What a test does to a file, as a Vendor's spreadsheet program would.
export interface Changes {
  // Cells written over in the rows of these part numbers.
  change?: { partNumber: string; to: RowWritten }[];
  // Rows added below the last.
  add?: RowWritten[];
  // A heading written over, by its column, counted from 1.
  heading?: { column: number; to: string };
}

// The file with the test's changes made, as the library saves it.
export async function changedOfferSheet(file: Buffer, changes: Changes): Promise<Buffer> {
  const workbook = new Workbook();
  await workbook.xlsx.load(file as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (worksheet === undefined) throw new Error('The file holds no worksheet.');
  for (const { partNumber, to } of changes.change ?? []) {
    let found = false;
    worksheet.eachRow((row, number) => {
      if (number === 1 || row.getCell(1).value !== partNumber) return;
      found = true;
      for (const [index, key] of columns.entries()) {
        if (key in to) row.getCell(index + 1).value = to[key] ?? null;
      }
      row.commit();
    });
    if (!found) throw new Error(`No row has the part number ${partNumber}.`);
  }
  for (const row of changes.add ?? []) worksheet.addRow(cellsOf(row));
  if (changes.heading !== undefined) {
    worksheet.getRow(1).getCell(changes.heading.column).value = changes.heading.to;
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// The type of an .xlsx file, as a phone's files give it.
const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Chooses a file in the screen's file field, as a Vendor does from its
// phone's files.
export async function chooseTheFile(
  page: Page,
  { name, file }: { name: string; file: Buffer },
): Promise<void> {
  await theFileField(page).setInputFiles({ name, mimeType: xlsx, buffer: file });
}

// The upload's result, as the API answers it, as far as the tests read it.
export interface OfferSheetResult {
  rows: number;
  added: { row: number; part: { id: string; name: string }; offerId: string }[];
  changed: number;
  confirmed: number;
  matchedByYourOffer: { row: number; part: { id: string; name: string } }[];
  skipped: {
    row: number;
    partNumber: string;
    problem: 'noPart' | 'severalParts' | 'samePart' | 'notValid';
    name?: string | null;
    partRequestOpen?: boolean;
    parts?: { id: string; name: string }[];
    partCount?: number;
    part?: { id: string; name: string };
    rows?: number[];
    otherRows?: number;
    field?: string;
    reason?: string;
  }[];
}

// Chooses the file and uploads it with the screen's button, as a Vendor
// does, and gives back the API's answer: its status, and its body.
export async function uploadTheOfferSheet(
  page: Page,
  chosen: { name: string; file: Buffer },
): Promise<{ status: number; body: unknown }> {
  await chooseTheFile(page, chosen);
  const answered = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/offer-sheet') &&
      response.request().method() === 'POST',
  );
  await theUploadButton(page).click();
  const response = await answered;
  return { status: response.status(), body: await response.json() };
}

// The same, for an upload the API applies, with its result.
export async function uploadAndApply(
  page: Page,
  chosen: { name: string; file: Buffer },
): Promise<OfferSheetResult> {
  const { status, body } = await uploadTheOfferSheet(page, chosen);
  expect(status).toBe(200);
  await expect(theResult(page)).toBeVisible();
  return body as OfferSheetResult;
}

// ------------------------------------------------------------- the result

// The upload's result on the screen.
export function theResult(page: Page): Locator {
  return page.getByTestId('upload-result');
}

// One of the result's counts, by what it counts.
export function theCount(
  page: Page,
  kind: 'added' | 'changed' | 'confirmed' | 'skipped',
): Locator {
  return theResult(page).locator(`[data-testid="result-count"][data-kind="${kind}"]`);
}

// Expects the result's counts to be those the API answered.
export async function expectTheCountsOf(
  page: Page,
  result: OfferSheetResult,
): Promise<void> {
  await expect(theResult(page)).toHaveAttribute('data-rows', String(result.rows));
  await expect(theCount(page, 'added')).toHaveAttribute(
    'data-count',
    String(result.added.length),
  );
  await expect(theCount(page, 'changed')).toHaveAttribute(
    'data-count',
    String(result.changed),
  );
  await expect(theCount(page, 'confirmed')).toHaveAttribute(
    'data-count',
    String(result.confirmed),
  );
  if (result.skipped.length === 0) {
    await expect(theCount(page, 'skipped')).toHaveCount(0);
  } else {
    await expect(theCount(page, 'skipped')).toHaveAttribute(
      'data-count',
      String(result.skipped.length),
    );
  }
}

// The group of skipped rows of one problem.
export function theSkippedGroup(
  page: Page,
  problem: 'noPart' | 'severalParts' | 'samePart' | 'notValid',
): Locator {
  return theResult(page).locator(
    `[data-testid="skipped-group"][data-problem="${problem}"]`,
  );
}

// A skipped row, by its row number in the file.
export function theSkippedRow(page: Page, row: number): Locator {
  return theResult(page).locator(`[data-testid="skipped-row"][data-row="${row}"]`);
}

// The Offers the upload added, one row each.
export function theAddedRows(page: Page): Locator {
  return theResult(page).getByTestId('added-row');
}

// The rows applied by the tie-break, one row each.
export function theRowsMatchedByYourOffer(page: Page): Locator {
  return theResult(page).getByTestId('matched-by-your-offer-row');
}

// A skipped row's way to the Part Request form.
export function askForItFrom(row: Locator): Locator {
  return row.getByTestId('ask-for-it');
}

// ------------------------------------------------------------- the API

// A Vendor's Offers as the API lists them, as far as the tests read them.
export interface ListedOffer {
  id: string;
  part: { id: string; name: string };
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
}

// The Vendor's Offers as the API lists them, one answer of as many as it
// gives at once.
export async function theVendorsOffers(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
): Promise<ListedOffer[]> {
  const answered = await request.get(`${apiUrl}/v1/vendors/${vendorId}/offers?size=100`, {
    headers: { authorization },
  });
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { content: ListedOffer[] }).content;
}

// A Part's Visible Offers as the API answers them to a Shopper.
export async function theVisibleOffersOf(
  request: APIRequestContext,
  partId: string,
): Promise<{ vendor: { id: string }; iqdPrice: number | null }[]> {
  const answered = await request.get(`${apiUrl}/v1/parts/${partId}/offers?currency=IQD`);
  expect(answered.status()).toBe(200);
  return (await answered.json()) as { vendor: { id: string }; iqdPrice: number | null }[];
}
