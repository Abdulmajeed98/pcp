import {
  type APIRequestContext,
  expect,
  type Page,
  type Response,
  test,
} from '@playwright/test';

import { shopperUrl } from './platform';

// The platform's three languages and the direction each is laid out in. They
// are written out here and not read from the platform's code, so that a
// language which changes its direction there fails here.
export const languages = [
  { tag: 'ckb', name: 'Kurdish', direction: 'rtl' },
  { tag: 'ar', name: 'Arabic', direction: 'rtl' },
  { tag: 'en', name: 'English', direction: 'ltr' },
] as const;

export type Language = (typeof languages)[number];

// The window the language tests run in: as wide as a narrow phone. The
// Playwright configuration gives it to the files named `…-languages.spec.ts`.
export const narrowWindow = { width: 360, height: 740 };

// A page's address in a language. The language is the first part of every
// address of the Shopper app, and `address` is what follows it: nothing for
// the first page, or a path that starts with a slash.
export function addressIn(language: Language, address = ''): string {
  return `${shopperUrl}/${language.tag}${address}`;
}

// What a test says about the page it checks. `drawnByScript` is for the one
// screen the server does not send whole: Next answers an address that matches
// no page with a bare document, and the browser draws the "not found" screen
// from it. That screen is checked as the browser shows it. Every other page
// has to declare its language and its direction in what the server sends.
interface About {
  drawnByScript?: boolean;
}

// Opens a page of the Shopper app in each of the three languages, in a window
// as wide as a narrow phone, and checks what holds for every page: the
// language it declares, its direction, that the server sent it with both,
// that it is inside the frame every page shares, and that it does not scroll
// sideways. The test of a page calls it once.
//
// It confirms that the page came back in the language it asked for before it
// reads anything else. Kurdish and Arabic are both right to left, so a check
// of the direction alone passes on the wrong one of the two.
export async function checkInEveryLanguage(
  page: Page,
  address = '',
  about: About = {},
): Promise<void> {
  await readInEveryLanguage(page, address, async () => {}, about);
}

// The same checks, and then what the test reads from the page in each
// language, such as a piece of text to tell the three apart by.
export async function readInEveryLanguage<Read>(
  page: Page,
  address: string,
  read: (language: Language, response: Response) => Promise<Read>,
  { drawnByScript = false }: About = {},
): Promise<Map<Language, Read>> {
  expect(page.viewportSize()?.width, 'the window is as wide as a narrow phone').toBe(
    narrowWindow.width,
  );

  const readings = new Map<Language, Read>();
  for (const language of languages) {
    await test.step(`in ${language.name}`, async () => {
      const response = await page.goto(addressIn(language, address));
      if (response === null) throw new Error('The address was answered with no page.');

      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', language.tag);
      await expect(html).toHaveAttribute('dir', language.direction);
      if (!drawnByScript) {
        const sent = await fetchWithNoBrowser(page.request, addressIn(language, address));
        expect(sent.language, 'the server sends the page with its language').toBe(
          language.tag,
        );
        expect(sent.direction, 'the server sends the page with its direction').toBe(
          language.direction,
        );
      }
      await expect(page.getByTestId('frame')).toBeVisible();
      await expectNoSidewaysScroll(page);

      readings.set(language, await read(language, response));
    });
  }
  return readings;
}

// A page scrolls sideways when something in it is wider than the window. In a
// page that is laid out right to left, what is too wide runs off to the left,
// and the document counts that as well.
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const { pageWidth, windowWidth } = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    windowWidth: document.documentElement.clientWidth,
  }));

  expect(pageWidth, 'the page is no wider than the window').toBeLessThanOrEqual(
    windowWidth,
  );
}

// The same piece of text, read in each of the three languages, is there and
// differs between them. No test quotes a translation, because the review may
// change every one of them: this is how the languages are told apart.
export function expectADifferentTextInEachLanguage(texts: Map<Language, string>): void {
  const read = languages.map((language) => (texts.get(language) ?? '').trim());

  for (const text of read) expect(text).not.toBe('');
  expect(new Set(read).size, `each of ${JSON.stringify(read)} differs`).toBe(
    languages.length,
  );
}

// A page as the server sends it, fetched with no browser, so no script has
// run: the language and the direction its document declares, and the text a
// reader would see in it.
export async function fetchWithNoBrowser(
  request: APIRequestContext,
  address: string,
): Promise<{ status: number; language?: string; direction?: string; text: string }> {
  const response = await request.get(address);
  const html = await response.text();
  const openingTag = /<html\b[^>]*>/.exec(html)?.[0] ?? '';

  return {
    status: response.status(),
    language: /\blang="([^"]*)"/.exec(openingTag)?.[1],
    direction: /\bdir="([^"]*)"/.exec(openingTag)?.[1],
    text: readableText(html),
  };
}

// How React writes the characters that HTML keeps for itself.
const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
};
const anEntity = new RegExp(Object.keys(entities).join('|'), 'g');

// What is left of a page's HTML when everything a reader does not see is
// taken out. Next also sends the page's content inside scripts, for the
// browser to take over from, and text found only there was never on the
// page the server sent.
function readableText(html: string): string {
  return html
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(anEntity, (entity) => entities[entity] ?? entity)
    .replace(/\s+/g, ' ');
}

// The addresses a page's answer names for search engines, by the language
// each is in. They arrive in the answer's `Link` header, one entry for each
// language.
export function alternateAddresses(link = ''): Map<string, string> {
  const entries = link.matchAll(/<([^>]*)>;\s*rel="alternate";\s*hreflang="([^"]*)"/g);

  return new Map([...entries].map(([, address, language]) => [language, address]));
}
