import { expect, type Locator, type Page } from '@playwright/test';

import type { BuildCategory } from './build-page';
import type { Language } from './languages';
import { shopperUrl } from './platform';

// The picker (builder ticket 09): a Category's Parts in stock, which a
// Shopper picks a Part for their Build from, at `/<language>/build/
// <category>`, its Category written as on a Category page. Its search and
// filters are a Category page's, so the Category page's helpers find its
// search box, its filters and its sentence; the helpers here are the
// picker's own.

// Each Category's name in the Shopper's addresses, written out here, since
// the tests import none of the platform's code.
const namesInTheAddress: Record<BuildCategory, string> = {
  cpu: 'cpu',
  cpuCooler: 'cpu-cooler',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  gpu: 'gpu',
  case: 'case',
  psu: 'psu',
};

// The eight Categories, in the catalog's order.
export const buildCategories = Object.keys(namesInTheAddress) as BuildCategory[];

// The path of a Category's picker after the language, with a query when one
// is given, as `?search=…`.
export function pickerPath(category: BuildCategory, query = ''): string {
  return `/build/${namesInTheAddress[category]}${query}`;
}

// A Category's picker in a language, with a query when one is given.
export function pickerIn(
  language: Language['tag'] | Language,
  category: BuildCategory,
  query = '',
): string {
  const tag = typeof language === 'string' ? language : language.tag;
  return `${shopperUrl}/${tag}${pickerPath(category, query)}`;
}

// Every Part the picker lists, in its order, each with its pick control.
export function pickerParts(page: Page): Locator {
  return page.getByTestId('picker-part');
}

// The identifiers of the Parts the picker lists, in their order.
export async function partsInThePicker(page: Page): Promise<string[]> {
  return pickerParts(page).evaluateAll((parts) =>
    parts.map((part) => part.getAttribute('data-part') ?? ''),
  );
}

// The picker lists these Parts, in this order, once it has drawn its list:
// a list drawn again in place, by a search, a filter or the switch with
// script, is waited for.
export async function expectThePickerToList(page: Page, ids: string[]): Promise<void> {
  await expect.poll(() => partsInThePicker(page)).toEqual(ids);
}

// One Part in the picker, by its identifier.
export function pickerPartOf(page: Page, partId: string): Locator {
  return page.locator(`[data-testid="picker-part"][data-part="${partId}"]`);
}

// The pick control of a Part in the picker: Pick, or Add one more for a RAM
// kit or a drive the Build holds.
export function pickOf(page: Page, partId: string): Locator {
  return pickerPartOf(page, partId).getByTestId('pick');
}

// Picks a Part in the picker, as a Shopper does with a tap on its pick
// control, and waits for the Build page the pick is answered with, at the
// place of the Part's Category.
export async function pickInThePicker(page: Page, partId: string): Promise<void> {
  await pickOf(page, partId).click();
  await page.waitForURL((url) => /^\/[a-z]+\/build$/.test(url.pathname) && url.hash !== '');
}

// The picker's switch, which shows the Parts not Compatible with the Build.
export function theSwitch(page: Page): Locator {
  return page.getByTestId('switch');
}

// Turns the switch on or off with a tap, and waits for the address that
// holds it, or no longer does.
export async function turnTheSwitch(page: Page, on: boolean): Promise<void> {
  await theSwitch(page).click();
  await page.waitForURL((url) => (url.searchParams.get('show') === 'all') === on);
}
