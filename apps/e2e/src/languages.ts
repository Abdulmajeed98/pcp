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

// The width of the window the language tests run in, which the Playwright
// configuration sets for the files named `…-languages.spec.ts`.
const narrowWidth = 360;

// A page's address in a language. The language is the first part of every
// address of the Shopper app, and `address` is what follows it: nothing for
// the first page, or a path that starts with a slash.
export function addressIn(language: Language, address = ''): string {
  return `${shopperUrl}/${language.tag}${address}`;
}

// Opens a page of the Shopper app in each of the three languages, in a window
// as wide as a narrow phone, and checks what holds for every page: the
// language it declares, its direction, that it is inside the frame every
// page shares, and that it does not scroll sideways.
// The test of a page calls it once, and reads what is its own in `look`.
//
// It confirms that the page came back in the language it asked for before it
// reads anything else. Kurdish and Arabic are both right to left, so a check
// of the direction alone passes on the wrong one of the two.
export async function checkInEveryLanguage(
  page: Page,
  address = '',
  look: (language: Language, response: Response) => Promise<void> = async () => {},
): Promise<void> {
  expect(page.viewportSize()?.width, 'the window is as wide as a narrow phone').toBe(
    narrowWidth,
  );

  for (const language of languages) {
    await test.step(`in ${language.name}`, async () => {
      const response = await page.goto(addressIn(language, address));
      if (response === null) throw new Error('The address was answered with no page.');

      const document = page.locator('html');
      await expect(document).toHaveAttribute('lang', language.tag);
      await expect(document).toHaveAttribute('dir', language.direction);
      await expect(page.getByTestId('frame')).toBeVisible();
      await expectNoSidewaysScroll(page);

      await look(language, response);
    });
  }
}

// A page scrolls sideways when something in it is wider than the window. In a
// page that is laid out right to left, what is too wide runs off to the left,
// and the document counts that as well.
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const { content, window } = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: document.documentElement.clientWidth,
  }));

  expect(content, 'the page is no wider than the window').toBeLessThanOrEqual(window);
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
  const document = /<html\b[^>]*>/.exec(html)?.[0] ?? '';

  return {
    status: response.status(),
    language: /\blang="([^"]*)"/.exec(document)?.[1],
    direction: /\bdir="([^"]*)"/.exec(document)?.[1],
    text: readableText(html),
  };
}

const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
};

// What is left of a page's HTML when everything a reader does not see is
// taken out. Next also sends the page's content inside scripts, for the
// browser to take over from, and text found only there was never on the
// page the server sent.
function readableText(html: string): string {
  return html
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#x27|#39);/g, (entity) => entities[entity] ?? entity)
    .replace(/\s+/g, ' ');
}

// The addresses a page's answer names for search engines, by the language
// each is in. They arrive in the answer's `Link` header, one entry for each
// language.
export function alternateAddresses(link = ''): Map<string, string> {
  const entries = link.matchAll(/<([^>]*)>;\s*rel="alternate";\s*hreflang="([^"]*)"/g);

  return new Map([...entries].map(([, address, language]) => [language, address]));
}
