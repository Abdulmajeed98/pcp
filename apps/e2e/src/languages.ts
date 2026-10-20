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

// The language the language tests' browser is set to, unless a test sets its
// own: Arabic as written in Iraq. The Playwright configuration gives it to
// the same files.
//
// It is the browser in which a number shows its fault. Chromium has no number
// formatting for Kurdish, and formats a Kurdish number in the language the
// browser itself is set to. A page that let the browser format a number in
// the page's language would show Western digits in a browser set to English,
// and no test there would see it. In this one it shows Arabic-Indic digits.
export const arabicOfIraq = 'ar-IQ';

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
// page shares, that the switch is where a Shopper can tap it, that every digit
// on it is a Western one, and that the page does not scroll sideways. The test
// of a page calls it once.
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
  return readInEachLanguage(
    page,
    {
      show: async (language) => {
        const response = await page.goto(addressIn(language, address));
        if (response === null) throw new Error('The address was answered with no page.');
        return response;
      },
      expectAlso: drawnByScript
        ? undefined
        : (language) => expectWhatTheServerSent(page, language, address),
      expectTheSwitch: (language) => expectTheSwitchOnThePage(page, language, address),
    },
    read,
  );
}

// How a language test brings a page up in each language, and what it checks
// there beyond what holds for every page.
interface InEachLanguage<Shown> {
  // Shows the page in a language, and gives what a test may read beside it.
  show: (language: Language) => Promise<Shown>;
  // What else holds, once the page declares the language.
  expectAlso?: (language: Language) => Promise<void>;
  // The frontend's own language switch, as it is on the page in a language.
  expectTheSwitch: (language: Language) => Promise<void>;
}

// What every language test does, for a page of either frontend: it confirms
// that the browser is one that shows a number's fault, and then, in each
// language, shows the page, confirms that it came back in that language
// before it reads anything else, and checks the frame, the switch, the
// digits and the width before the test reads what it reads.
async function readInEachLanguage<Shown, Read>(
  page: Page,
  { show, expectAlso, expectTheSwitch }: InEachLanguage<Shown>,
  read: (language: Language, shown: Shown) => Promise<Read>,
): Promise<Map<Language, Read>> {
  await expectABrowserThatShowsTheFault(page);

  const readings = new Map<Language, Read>();
  for (const language of languages) {
    await test.step(`in ${language.name}`, async () => {
      const shown = await show(language);

      await expectPageIn(page, language);
      await expectAlso?.(language);
      await expect(page.getByTestId('frame')).toBeVisible();
      await expectTheSwitch(language);
      await expectWesternDigitsOnly(page);
      await expectNoSidewaysScroll(page);

      readings.set(language, await read(language, shown));
    });
  }
  return readings;
}

// A page as the server sent it, fetched with no browser: it declares its
// language and its direction, it holds the switch's three links, and it holds
// no Arabic-Indic digit.
async function expectWhatTheServerSent(
  page: Page,
  language: Language,
  address: string,
): Promise<void> {
  const sent = await fetchWithNoBrowser(page.request, addressIn(language, address));
  expect(sent.language, 'the server sends the page with its language').toBe(language.tag);
  expect(sent.direction, 'the server sends the page with its direction').toBe(
    language.direction,
  );
  expectTheSwitchInWhatTheServerSent(sent.links, address);
  expect(
    arabicIndicDigitsIn(sent.text),
    'the server sends the page with no Arabic-Indic digit',
  ).toEqual([]);
}

// The page the browser shows declares this language and its direction.
export async function expectPageIn(page: Page, language: Language): Promise<void> {
  const html = page.locator('html');
  await expect(html).toHaveAttribute('lang', language.tag);
  await expect(html).toHaveAttribute('dir', language.direction);
}

// The language switch, which the frame holds on every page of the Shopper
// app and every screen of the Vendor portal.
export function languageSwitch(page: Page): Locator {
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
// marked as the current one, and the switch is within reach of a thumb.
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
    expect(
      await linkTo(page, other).evaluate((anchor) => (anchor as HTMLAnchorElement).href),
      `the link to ${other.name} is to this page in ${other.name}`,
    ).toBe(addressIn(other, address));
  }

  await expectTheSwitchWithinReach(page, language, (other) => linkTo(page, other));
}

// The switch on a page in `language` is where a thumb can reach it. What it
// offers for each language, found by `choiceOf`, is inside the window and
// large enough to tap, and the switch is on the end side of the frame: the
// right in English, and the left in Kurdish and Arabic.
async function expectTheSwitchWithinReach(
  page: Page,
  language: Language,
  choiceOf: (other: Language) => Locator,
): Promise<void> {
  for (const other of languages) {
    const box = await boxOf(choiceOf(other));
    const insideTheWindow =
      box.left >= 0 &&
      box.right <= narrowWindow.width &&
      box.top >= 0 &&
      box.bottom <= narrowWindow.height;
    expect(
      insideTheWindow,
      `the choice of ${other.name}, at ${JSON.stringify(box)}, is inside the window`,
    ).toBe(true);
    expect(
      Math.min(box.right - box.left, box.bottom - box.top),
      `the choice of ${other.name} is large enough to tap`,
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

// The Vendor portal's switch's button for one language, found by the
// language's own name. The Vendor portal has no addresses of its own, so its
// switch changes the language in place, with a button and not a link.
export function buttonFor(page: Page, language: Language): Locator {
  return languageSwitch(page).getByRole('button', { name: language.ownName, exact: true });
}

// The switch as a Vendor finds it, on a screen of the Vendor portal in
// `language`: three buttons, for Kurdish, Arabic and English in that order,
// each under its own name. The one the screen is in is shown as pressed, and
// the switch is within reach of a thumb.
async function expectTheVendorPortalsSwitch(page: Page, language: Language): Promise<void> {
  const buttons = languageSwitch(page).getByRole('button');
  await expect(buttons).toHaveText(languages.map(({ ownName }) => ownName));
  await expect(languageSwitch(page).getByRole('button', { pressed: true })).toHaveText([
    language.ownName,
  ]);

  await expectTheSwitchWithinReach(page, language, (other) => buttonFor(page, other));
}

// Shows a screen of the Vendor portal, as a Vendor, in each of
// the three languages in turn, by a tap on the switch, in a window as wide as
// a narrow phone. It checks what holds for every screen: the language it
// declares, its direction, that it is inside the frame, that the switch is
// where a Vendor can tap it, that every digit on it is a Western one, and
// that it does not scroll sideways. The test of a screen calls it once,
// after the screen is open.
//
// It confirms that the screen is in the language it asked for before it
// reads anything else, as the Shopper app's helper does.
export async function checkInEveryLanguageOfTheVendorPortal(page: Page): Promise<void> {
  await readInEveryLanguageOfTheVendorPortal(page, async () => {});
}

// The same checks, and then what the test reads from the screen in each
// language.
//
// A screen checked with something open over it, such as an alert dialog,
// which hides the switch and keeps it from a tap while it is open, gives how
// to open it and how to close it. It is closed before each tap on the
// switch, and opened again once the switch has been checked, so that the
// digits, the width and what the test reads are checked with it open.
export async function readInEveryLanguageOfTheVendorPortal<Read>(
  page: Page,
  read: (language: Language) => Promise<Read>,
  openOver?: { open: () => Promise<void>; close: () => Promise<void> },
): Promise<Map<Language, Read>> {
  let opened = false;

  return readInEachLanguage(
    page,
    {
      show: async (language) => {
        if (opened) await openOver?.close();
        opened = false;
        await buttonFor(page, language).click();
      },
      expectTheSwitch: async (language) => {
        await expectTheVendorPortalsSwitch(page, language);
        if (openOver !== undefined) {
          await openOver.open();
          opened = true;
        }
      },
    },
    read,
  );
}

// The language tests' window is as wide as a narrow phone, and their browser
// is one that writes a number it formats for Kurdish in Arabic-Indic digits.
// Without this, a page that formats a number in the browser would pass the
// check of its digits in a browser that happens to write Western ones.
async function expectABrowserThatShowsTheFault(page: Page): Promise<void> {
  expect(page.viewportSize()?.width, 'the window is as wide as a narrow phone').toBe(
    narrowWindow.width,
  );
  expect(
    await page.evaluate(() => new Intl.NumberFormat('ckb').format(3)),
    'this browser writes a number it formats for Kurdish in Arabic-Indic digits',
  ).toBe('٣');
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
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const { pageWidth, windowWidth } = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    windowWidth: document.documentElement.clientWidth,
  }));

  expect(pageWidth, 'the page is no wider than the window').toBeLessThanOrEqual(
    windowWidth,
  );
}

// How the browser lays out the text of an element: the direction the text
// runs in, and whether it is kept apart from the sentence around it, so that
// neither reorders the other. Both are read as the browser worked them out,
// whatever markup they came from.
export async function layoutOf(
  element: Locator,
): Promise<{ direction: string; keptApart: boolean }> {
  return element.evaluate((node) => {
    const style = getComputedStyle(node);

    return { direction: style.direction, keptApart: style.unicodeBidi === 'isolate' };
  });
}

// The characters of an element's text as the browser drew them: line by line,
// and in each line from left to right. Text that runs left to right is drawn
// as it is written. Where the browser has reordered its pieces, as it does
// with "80 mm" inside a Kurdish sentence, this answers "mm 80".
export async function linesAsDrawn(element: Locator): Promise<string[]> {
  return element.evaluate((root) => {
    const characters: { character: string; left: number; top: number; height: number }[] =
      [];
    const texts = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let text = texts.nextNode(); text !== null; text = texts.nextNode()) {
      const written = text.textContent ?? '';
      for (let index = 0; index < written.length; index += 1) {
        const one = document.createRange();
        one.setStart(text, index);
        one.setEnd(text, index + 1);
        const { left, top, height } = one.getBoundingClientRect();
        characters.push({ character: written[index], left, top, height });
      }
    }

    // A character is on the line of the one above it in this list when it is
    // less than half its own height further down.
    const lines: (typeof characters)[] = [];
    for (const one of characters.sort((a, b) => a.top - b.top)) {
      const line = lines.at(-1);
      if (line !== undefined && one.top - line[0].top < one.height / 2) line.push(one);
      else lines.push([one]);
    }

    return lines.map((line) =>
      line
        .sort((a, b) => a.left - b.left)
        .map(({ character }) => character)
        .join(''),
    );
  });
}

// The digits a page must never show: ٠ to ٩, the Arabic set, and ۰ to ۹, the
// Persian set. LANG-5 asks for Western digits, 0 to 9, in prices and
// specifications, and the platform writes every number so, in every language.
const anArabicIndicDigit = /[\u0660-\u0669\u06F0-\u06F9]/g;

// The Arabic-Indic digits in a piece of text, of either set.
function arabicIndicDigitsIn(text: string): string[] {
  return text.match(anArabicIndicDigit) ?? [];
}

// Nothing a reader reads on the page, and nothing in the tab's title, holds
// an Arabic-Indic digit, but for what someone wrote. That is shown as they
// wrote it, Arabic-Indic digits and all (LANG-4), and is the text marked as
// written: the elements whose direction comes from their text. A test of a
// screen that shows such text checks it as written itself.
async function expectWesternDigitsOnly(page: Page): Promise<void> {
  const shown = await page.locator('body').evaluate((body) => {
    const texts = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const read: string[] = [];
    for (let text = texts.nextNode(); text !== null; text = texts.nextNode()) {
      const holder = text.parentElement;
      if (holder === null || holder.closest('[dir="auto"], script, style') !== null) {
        continue;
      }
      read.push(text.textContent ?? '');
    }
    return read.join('\n');
  });
  const read = `${await page.title()}\n${shown}`;

  expect(arabicIndicDigitsIn(read), 'the page shows no Arabic-Indic digit').toEqual([]);
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

// The elements that sit inside a line of text: the ones the HTML Standard
// lists as text-level, but for the line break. A reader sees no gap where one
// starts or ends, so "<bdi>name</bdi>." reads "name." and not "name .".
const anElementInALine =
  /<\/?(?:a|abbr|b|bdi|bdo|cite|code|data|dfn|em|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var)\b[^>]*>/g;

// What is left of a page's HTML when everything a reader does not see is
// taken out. Next also sends the page's content inside scripts, for the
// browser to take over from, and text found only there was never on the
// page the server sent.
function readableText(html: string): string {
  return withoutEntities(
    html
      .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(anElementInALine, '')
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
