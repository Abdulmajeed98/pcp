import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  type Response,
  test,
} from '@playwright/test';

import { shopperUrl } from './platform';

// The platform's three languages, in the order they are always listed in,
// with the direction each is laid out in. They are written out here and not
// read from the platform's code, so that a language which changes its
// direction there fails here.
//
// `ownName` is the language's name in its own script, which is what the
// language switch calls it on every page. It is not a translation: it is the
// same in all three languages.
export const languages = [
  { tag: 'ckb', name: 'Kurdish', ownName: 'کوردی', direction: 'rtl' },
  { tag: 'ar', name: 'Arabic', ownName: 'العربية', direction: 'rtl' },
  { tag: 'en', name: 'English', ownName: 'English', direction: 'ltr' },
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
// has to declare its language and its direction in what the server sends,
// and to hold the switch's three links there.
interface About {
  drawnByScript?: boolean;
}

// Opens a page of the Shopper app in each of the three languages, in a window
// as wide as a narrow phone, and checks what holds for every page: the
// language it declares, its direction, that the server sent it with both and
// with the language switch's three links, that it is inside the frame every
// page shares, that the switch is where a Shopper can tap it, and that the
// page does not scroll sideways. The test of a page calls it once.
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

      await expectPageIn(page, language);
      if (!drawnByScript) {
        const sent = await fetchWithNoBrowser(page.request, addressIn(language, address));
        expect(sent.language, 'the server sends the page with its language').toBe(
          language.tag,
        );
        expect(sent.direction, 'the server sends the page with its direction').toBe(
          language.direction,
        );
        expectTheSwitchInWhatTheServerSent(sent.links, address);
      }
      await expect(page.getByTestId('frame')).toBeVisible();
      await expectTheSwitchOnThePage(page, language, address);
      await expectNoSidewaysScroll(page);

      readings.set(language, await read(language, response));
    });
  }
  return readings;
}

// The page the browser shows declares this language and its direction.
export async function expectPageIn(page: Page, language: Language): Promise<void> {
  const html = page.locator('html');
  await expect(html).toHaveAttribute('lang', language.tag);
  await expect(html).toHaveAttribute('dir', language.direction);
}

// The language switch, which the frame holds on every page.
function languageSwitch(page: Page): Locator {
  return page.getByTestId('language-switch');
}

// The switch's link to one language, found by the language's own name.
export function linkTo(page: Page, language: Language): Locator {
  return languageSwitch(page).getByRole('link', { name: language.ownName, exact: true });
}

// The least a thing may measure, each way, for a thumb to tap it: 44 CSS
// pixels, the size both Apple's guidelines and WCAG's "Target Size
// (Enhanced)" give.
const largeEnoughToTap = 44;

// The switch as a Shopper finds it in the browser, on a page in `language`:
// three links, to Kurdish, Arabic and English in that order, each under its
// own name and each to the page the Shopper is on. The one the page is in is
// marked as the current one. Each is inside the window and large enough to
// tap, and the switch is on the end side of the frame: the right in English,
// and the left in Kurdish and Arabic.
async function expectTheSwitchOnThePage(
  page: Page,
  language: Language,
  address: string,
): Promise<void> {
  const links = languageSwitch(page).getByRole('link');
  await expect(links).toHaveText(languages.map(({ ownName }) => ownName));
  await expect(links.and(page.locator('[aria-current="page"]'))).toHaveText([
    language.ownName,
  ]);

  for (const other of languages) {
    const link = linkTo(page, other);
    expect(
      await link.evaluate((anchor) => (anchor as HTMLAnchorElement).href),
      `the link to ${other.name} is to this page in ${other.name}`,
    ).toBe(addressIn(other, address));

    const box = await boxOf(link);
    const insideTheWindow =
      box.left >= 0 &&
      box.right <= narrowWindow.width &&
      box.top >= 0 &&
      box.bottom <= narrowWindow.height;
    expect(
      insideTheWindow,
      `the link to ${other.name}, at ${JSON.stringify(box)}, is inside the window`,
    ).toBe(true);
    expect(
      Math.min(box.right - box.left, box.bottom - box.top),
      `the link to ${other.name} is large enough to tap`,
    ).toBeGreaterThanOrEqual(largeEnoughToTap);
  }

  const frame = await boxOf(page.getByTestId('frame'));
  const theSwitch = await boxOf(languageSwitch(page));
  const roomOnTheLeft = theSwitch.left - frame.left;
  const roomOnTheRight = frame.right - theSwitch.right;
  const [roomAtTheStart, roomAtTheEnd] =
    language.direction === 'ltr'
      ? [roomOnTheLeft, roomOnTheRight]
      : [roomOnTheRight, roomOnTheLeft];
  expect(roomAtTheEnd, 'the switch is on the end side of the frame').toBeLessThan(
    roomAtTheStart,
  );
}

// Where an element is in the window, by its four edges.
async function boxOf(
  element: Locator,
): Promise<{ left: number; right: number; top: number; bottom: number }> {
  const box = await element.boundingBox();
  if (box === null) throw new Error('The element is not on the page.');

  return { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height };
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

// A link in a page: the whole address it leads to, and the text a reader
// sees in it.
interface Link {
  leadsTo: string;
  text: string;
}

// A page as the server sends it, fetched with no browser, so no script has
// run: the language and the direction its document declares, the text a
// reader would see in it, and its links.
export async function fetchWithNoBrowser(
  request: APIRequestContext,
  address: string,
): Promise<{
  status: number;
  language?: string;
  direction?: string;
  text: string;
  links: Link[];
}> {
  const response = await request.get(address);
  const html = await response.text();
  const openingTag = /<html\b[^>]*>/.exec(html)?.[0] ?? '';

  return {
    status: response.status(),
    language: /\blang="([^"]*)"/.exec(openingTag)?.[1],
    direction: /\bdir="([^"]*)"/.exec(openingTag)?.[1],
    text: readableText(html),
    links: linksIn(html, address),
  };
}

// The links in a page's HTML. A link may be written from the page's own
// address, which is `from`.
function linksIn(html: string, from: string): Link[] {
  const anchors = html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g);

  return [...anchors].map(([, href, content]) => ({
    leadsTo: new URL(withoutEntities(href), from).href,
    text: readableText(content).trim(),
  }));
}

// The switch's three links are among the links of a page as the server sent
// it: one to that page in each language, under the language's own name, in
// the order the languages are listed in. They are links in the page as it
// arrives, so a tap on one needs no script. `address` is what follows the
// language in the page's address.
export function expectTheSwitchInWhatTheServerSent(links: Link[], address = ''): void {
  const ownNames: string[] = languages.map(({ ownName }) => ownName);

  expect(
    links.filter(({ text }) => ownNames.includes(text)),
    "the server sends the page with the switch's three links",
  ).toEqual(
    languages.map((language) => ({
      leadsTo: addressIn(language, address),
      text: language.ownName,
    })),
  );
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
  return withoutEntities(
    html
      .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]*>/g, ' '),
  ).replace(/\s+/g, ' ');
}

function withoutEntities(html: string): string {
  return html.replace(anEntity, (entity) => entities[entity] ?? entity);
}

// The addresses a page's answer names for search engines, by the language
// each is in. They arrive in the answer's `Link` header, one entry for each
// language.
export function alternateAddresses(link = ''): Map<string, string> {
  const entries = link.matchAll(/<([^>]*)>;\s*rel="alternate";\s*hreflang="([^"]*)"/g);

  return new Map([...entries].map(([, address, language]) => [language, address]));
}
