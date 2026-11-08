import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import type { Language } from './languages';
import { apiUrl, shopperUrl } from './platform';

// The Build page and the forms that change a Build (builder ticket 07). The
// Build is kept in the Shopper's browser, in a cookie only the Shopper app's
// server reads and writes, so a test arranges its Build by sending the pick
// form from its own browser, as the picker sends it, and reads the Build
// back from the API, never from the cookie.

// The API's keys of the eight Categories, written out here, since the tests
// import none of the platform's code.
export type BuildCategory =
  | 'cpu'
  | 'cpuCooler'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'gpu'
  | 'case'
  | 'psu';

// A Part as a test puts it in a Build: its identifier and its Category.
export interface BuildPart {
  id: string;
  category: BuildCategory;
}

// Sends the pick form from the page's own browser, as the picker sends it:
// `POST /<language>/build/pick` with a Category and a Part. The answer is a
// 303 to the Build page, which writes the Build into the browser's cookie;
// the redirect is not followed, and its address is given back.
export async function pick(
  page: Page,
  part: BuildPart,
  language: Language['tag'] = 'en',
): Promise<string> {
  const answer = await page.request.post(`${shopperUrl}/${language}/build/pick`, {
    form: { category: part.category, part: part.id },
    maxRedirects: 0,
  });
  expect(answer.status(), 'the pick form is answered with a redirect').toBe(303);
  return answer.headers().location ?? '';
}

// The Build page's address in a language.
export function buildPageIn(language: Language['tag'] | Language): string {
  return `${shopperUrl}/${typeof language === 'string' ? language : language.tag}/build`;
}

// What the API answers of a Build, in dinars: its Parts, whether it is a
// Complete Build and the Categories it still needs, in the catalog's order.
export interface AnsweredBuild {
  parts: { id: string; category: BuildCategory; name: string; quantity: number | null }[];
  complete: boolean;
  stillNeeded: BuildCategory[];
}

// `GET v1/build` for the Build of these `part` values: each Part's
// identifier, and for a kit or a drive `:` and its quantity.
export async function theBuildAsAnswered(
  request: APIRequestContext,
  values: string[],
): Promise<AnsweredBuild> {
  const query = new URLSearchParams([
    ['currency', 'IQD'],
    ...values.map((value) => ['part', value]),
  ]);
  const answer = await request.get(`${apiUrl}/v1/build?${query}`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as AnsweredBuild;
}

// A Part's line on the Build's sheet, with its controls.
export function lineOf(page: Page, partId: string): Locator {
  return page.locator(`[data-testid="build-part"][data-part="${partId}"]`);
}

// Every Part's line on the Build's sheet.
export function partLines(page: Page): Locator {
  return page.getByTestId('build-part');
}

// A Category's place on the Build's sheet.
export function placeOf(page: Page, category: BuildCategory): Locator {
  return page.getByTestId(`build-category-${category}`);
}

// The page's status, under the sheet's title.
export function theStatus(page: Page): Locator {
  return page.getByTestId('build-status');
}

// The Categories the status says the Build still needs, by their keys.
export async function categoriesStillNeeded(page: Page): Promise<string[]> {
  return theStatus(page)
    .getByTestId('still-needed')
    .evaluateAll((links) => links.map((link) => link.getAttribute('data-category') ?? ''));
}

// The frame's way to the Build page, as the window shows it: one of its two
// places is drawn at a time.
export function theWayToTheBuild(page: Page): Locator {
  return page.locator('[data-testid="frame-build"]:visible');
}

// How many Parts the frame says the Build holds.
export async function theFramesCount(page: Page): Promise<number> {
  return Number(await theWayToTheBuild(page).getAttribute('data-count'));
}

// A kit's or a drive's quantity form, and its figure.
export function quantityOf(page: Page, partId: string): Locator {
  return lineOf(page, partId).getByTestId('quantity');
}

export function figureOf(page: Page, partId: string): Locator {
  return quantityOf(page, partId).getByTestId('quantity-figure');
}

// What the quantity form says under it when a figure cannot be used.
export function whatTheQuantitySays(page: Page, partId: string): Locator {
  return lineOf(page, partId).getByTestId('quantity-problem');
}

// Remove, on a Part's line.
export function removeOf(page: Page, partId: string): Locator {
  return lineOf(page, partId).getByTestId('remove');
}

// Empty the Build, and its one confirmation.
export function emptyTheBuild(page: Page): Locator {
  return page.getByTestId('empty-the-build');
}

export async function emptyTheBuildAfterConfirming(page: Page): Promise<void> {
  await emptyTheBuild(page).locator('summary').click();
  await emptyTheBuild(page).getByTestId('empty-confirm').click();
}
