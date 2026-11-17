import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { buildPageIn } from './build-page';
import { arabicOfIraq, type Language, narrowWindow } from './languages';
import { apiUrl, shopperUrl } from './platform';

// Sharing a Build and its Shared Build page (sharing ticket 04). A Shared
// Build is stored by the API and named by a random identifier, so a test
// learns it from the address sharing lands on, and reads what the API
// stored over HTTP, never from the page alone.

// A Shared Build page's address: its language and its identifier.
const sharedBuildPage =
  /^http:\/\/localhost:3000\/(ckb|ar|en)\/builds\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function sharedBuildPageIn(
  language: Language['tag'],
  sharedBuildId: string,
): string {
  return `${shopperUrl}/${language}/builds/${sharedBuildId}`;
}

// The share button on the Build page's slip.
export function theShareButton(page: Page): Locator {
  return page.getByTestId('share-this-build');
}

// Shares the Build the page's browser holds, from its Build page in a
// language, with the button a Shopper taps, and gives back the identifier of
// the Shared Build its page names, once the page has landed there.
export async function shareFromTheBuildPage(
  page: Page,
  language: Language['tag'],
): Promise<string> {
  await page.goto(buildPageIn(language));
  await theShareButton(page).click();
  await expect(page).toHaveURL(sharedBuildPage);
  const [, , sharedBuildId] = sharedBuildPage.exec(page.url()) ?? [];
  if (sharedBuildId === undefined)
    throw new Error('Sharing landed on no Shared Build page.');
  return sharedBuildId;
}

// What the API stores of a Shared Build: its frozen `part` values and the
// moment it was shared.
export async function theSharedBuildAsStored(
  request: APIRequestContext,
  sharedBuildId: string,
): Promise<{ id: string; sharedAt: string; part: string[] }> {
  const answer = await request.get(`${apiUrl}/v1/shared-builds/${sharedBuildId}`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as { id: string; sharedAt: string; part: string[] };
}

// The link the Shared Build page prints, which is copied by hand without
// script, and the button that shares or copies it.
export function theLink(page: Page): Locator {
  return page.getByTestId('the-link');
}

export function shareTheLinkButton(page: Page): Locator {
  return page.getByTestId('share-the-link-button');
}

// Copy into my Build: a button for a browser whose Build is empty, or the
// summary of its one confirmation, with Replace and Keep mine.
export function theCopy(page: Page): Locator {
  return page.getByTestId('copy-into-my-build');
}

export function theCopysConfirmation(page: Page): Locator {
  return theCopy(page).getByTestId('copy-confirm');
}

// "This is your Build", in the copy's place.
export function thisIsYourBuild(page: Page): Locator {
  return page.getByTestId('this-is-your-build');
}

// The Parts a page lists, each by its identifier, in the page's order.
export async function partsListed(page: Page): Promise<string[]> {
  return page
    .getByTestId('build-part')
    .evaluateAll((lines) => lines.map((line) => line.getAttribute('data-part') ?? ''));
}

// A browser of another Shopper, as wide as a narrow phone and set to Arabic
// as written in Iraq, as the language tests' own is, with script or not:
// it holds no Build until it copies or picks one.
export async function aFreshBrowser(
  browser: Browser,
  javaScriptEnabled = true,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport: narrowWindow,
    locale: arabicOfIraq,
    javaScriptEnabled,
  });
}
