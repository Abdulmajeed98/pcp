import {
  type Browser,
  type BrowserContextOptions,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { shopperUrl } from './platform';

// The two currencies a Shopper chooses between, by the code the platform
// knows each by, which is the same in every language. Dinars are the first a
// Shopper sees (PRC-2). A copy of the API's `Currency`, kept on purpose: the
// tests import no code of the platform's, so that they check it from outside.
export const currencies = ['IQD', 'USD'] as const;

export type Currency = (typeof currencies)[number];

// The currency switch, which the frame holds on every page of the Shopper app,
// beside the language switch.
export function currencySwitch(page: Page): Locator {
  return page.getByTestId('currency-switch');
}

// The switch's choice of one currency, found by the code it sends to the
// server, which is the same in every language.
export function choiceOf(page: Page, currency: Currency): Locator {
  return currencySwitch(page).locator(`button[value="${currency}"]`);
}

// The switch shows `currency` as the chosen one: its two choices are there,
// that one alone is marked as the current one.
export async function expectChosen(page: Page, currency: Currency): Promise<void> {
  await expect(currencySwitch(page).getByRole('button')).toHaveCount(currencies.length);
  await expect(currencySwitch(page).locator('[aria-current="true"]')).toHaveCount(1);
  await expect(choiceOf(page, currency)).toHaveAttribute('aria-current', 'true');
}

// The mark every price carries after its figure, which is the same in every
// language (DESIGN.md's The Shown Price).
const marks: Record<Currency, string> = { IQD: 'IQD', USD: '$' };

// Every price on the page is shown in `currency`, and there is at least one:
// each carries that currency's mark after its figure, and none the other's.
// The page holds prices only where the API answers them, so a test that
// reads them makes sure there is one first.
export async function expectPricesShownIn(page: Page, currency: Currency): Promise<void> {
  const prices = page.getByTestId('shown-price');
  await expect(prices.first()).toBeAttached();
  for (const price of await prices.all()) {
    await expect(price).toHaveAttribute('data-currency', currency);
    expect((await price.innerText()).trim().endsWith(` ${marks[currency]}`)).toBe(true);
  }
}

// Chooses a currency with the switch, as a Shopper does, and waits for the
// server's answer: the page it returns to. That is the page the choice was
// made on, address and all, unless `returnsTo` gives the address it returns
// to instead.
export async function choose(
  page: Page,
  currency: Currency,
  returnsTo = page.url(),
): Promise<void> {
  const asked = page.waitForRequest(
    (request) => request.isNavigationRequest() && request.method() === 'POST',
  );
  await choiceOf(page, currency).click();
  await asked;
  await expect(choiceOf(page, currency)).toHaveAttribute('aria-current', 'true');
  expect(page.url(), `the choice returns to ${returnsTo}`).toBe(returnsTo);
}

// What a choice leaves behind in the browser it was made in: a cookie that
// holds it for about a year, and not only until the browser is closed. A
// browser keeps a cookie that has an end after it is closed, and the choice
// is still there in a browser opened another day with what the first one
// kept, with `options` for that browser, such as scripts switched off.
export async function expectTheChoiceKept(
  page: Page,
  browser: Browser,
  currency: Currency,
  options: BrowserContextOptions = {},
): Promise<void> {
  const cookies = await page.context().cookies(shopperUrl);
  const kept = cookies.filter((cookie) => cookie.expires !== -1);
  const choice = kept.filter((cookie) => cookie.value === currency);
  expect(choice, 'the browser keeps the choice beyond the session').toHaveLength(1);
  const daysLeft = (choice[0].expires - Date.now() / 1000) / (60 * 60 * 24);
  expect(daysLeft).toBeGreaterThan(364);
  expect(daysLeft).toBeLessThan(366);

  const anotherDay = await browser.newContext({
    ...options,
    storageState: { cookies: kept, origins: [] },
  });
  try {
    const opened = await anotherDay.newPage();
    await opened.goto(page.url());
    await expectChosen(opened, currency);
  } finally {
    await anotherDay.close();
  }
}
