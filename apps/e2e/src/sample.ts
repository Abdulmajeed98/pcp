import { expect, type Locator, type Page } from '@playwright/test';

import { type Language, languages, layoutOf, linesAsDrawn } from './languages';

// The sample the Shopper app's placeholder page shows: one of each kind of
// text a later screen will hold. Its values are fixed in the page and made
// up, and they are the same in every language, so a test may name them. The
// Vendor portal's placeholder showed the same sample until its details
// screen replaced it.
//
// A sentence that counts is drawn once for each of these counts. Between them
// they take every plural form Arabic has but the one for nothing.
const sampleCounts = [1, 2, 3, 11, 100];
// A number beside its unit, a Part name and a specification. Each starts with
// a number. That is the text a Kurdish or an Arabic sentence reorders: it
// draws "80 mm" as "mm 80", unless the text is kept apart from the sentence.
const numberBesideItsUnit = '1,575,000 IOPS';
export const partName = '500 Sample 1TB';
export const specification = '80 mm';
// There are eight Categories (CAT-1).
const categories = 8;
// One line as someone wrote it in Arabic script, and one in Latin script.
const asWrittenLines = 2;

function countedSentences(page: Page): Locator {
  return page.getByTestId('counted-sentence');
}

function categoryNames(page: Page): Locator {
  return page.getByTestId('category-names').getByRole('listitem');
}

function linesAsWritten(page: Page): Locator {
  return page.getByTestId('as-written');
}

// A piece of text that is in English on every page, found by its own
// characters, as an element that holds nothing else. It is drawn in the order
// it is written in, whatever the direction of the sentence around it, because
// it runs left to right and is kept apart from that sentence.
export async function expectDrawnAsWritten(
  page: Page,
  alwaysEnglish: string,
): Promise<void> {
  const marked = page.getByText(alwaysEnglish, { exact: true });

  await expect(marked).toBeVisible();
  expect((await linesAsDrawn(marked)).join('')).toBe(alwaysEnglish);
  expect(await layoutOf(marked)).toEqual({ direction: 'ltr', keptApart: true });
}

// The direction a piece of text has of its own: that of its first letter.
// Arabic script runs right to left, and Latin script left to right.
function directionOfItsOwn(text: string): 'rtl' | 'ltr' {
  const firstLetter = /\p{L}/u.exec(text)?.[0] ?? '';

  return /\p{Script=Arabic}/u.test(firstLetter) ? 'rtl' : 'ltr';
}

// What someone wrote, such as a Vendor's name and address, is shown as
// written on every page (LANG-4). Each line runs in its own direction,
// whatever the page's is: the one in Arabic script right to left on an
// English page, and the one in Latin script left to right on the other two.
// So each starts on its own side: its first character is drawn at the far
// right of a line that runs right to left, and at the far left of one that
// runs left to right. This reads the lines, once each is checked so.
export async function readTheLinesAsWritten(page: Page): Promise<string[]> {
  const lines = linesAsWritten(page);
  await expect(lines).toHaveCount(asWrittenLines);

  const texts: string[] = [];
  for (const line of await lines.all()) {
    const text = await line.innerText();
    const ownDirection = directionOfItsOwn(text);
    const [firstLineDrawn] = await linesAsDrawn(line);

    expect(
      ownDirection === 'rtl' ? firstLineDrawn.at(-1) : firstLineDrawn[0],
      `"${text}", drawn "${firstLineDrawn}", starts on its own side`,
    ).toBe(text[0]);
    expect(await layoutOf(line)).toEqual({ direction: ownDirection, keptApart: true });
    texts.push(text);
  }
  // One line in each script, so both directions were checked.
  expect(texts.map(directionOfItsOwn).sort()).toEqual(['ltr', 'rtl']);

  return texts;
}

// The same thing, read in each of the three languages, is the same in all
// three.
export function expectTheSameInEveryLanguage(read: Map<Language, unknown>): void {
  const [inKurdish, inArabic, inEnglish] = languages.map((language) => read.get(language));

  expect(inKurdish).toBeDefined();
  expect(inArabic).toEqual(inKurdish);
  expect(inEnglish).toEqual(inKurdish);
}

// The sample's numbers. The number is beside its unit, and the two do not
// swap places. There is a sentence for each count, and a language may have a
// word of its own for one and for two, as Arabic has. From three up every
// language writes the count in digits. That the digits are Western ones is
// for the helper to see, on the whole page.
export async function expectTheNumbers(page: Page): Promise<void> {
  await expectDrawnAsWritten(page, numberBesideItsUnit);

  const sentences = await countedSentences(page).allInnerTexts();
  expect(sentences).toHaveLength(sampleCounts.length);
  for (const [index, count] of sampleCounts.entries()) {
    if (count >= 3) expect(sentences[index]).toContain(String(count));
  }
}

// The names of the eight Categories, each different from the others, as one
// line to tell the languages apart by.
export async function readTheCategoryNames(page: Page): Promise<string> {
  const names = await categoryNames(page).allInnerTexts();

  expect(names).toHaveLength(categories);
  expect(new Set(names).size, `each of ${JSON.stringify(names)} differs`).toBe(categories);
  return names.join(', ');
}

// The whole sample is on the page.
export async function expectTheWholeSample(page: Page): Promise<void> {
  await expect(categoryNames(page)).toHaveCount(categories);
  await expect(countedSentences(page)).toHaveCount(sampleCounts.length);
  await expect(page.getByText(numberBesideItsUnit, { exact: true })).toBeVisible();
  await expect(page.getByText(partName, { exact: true })).toBeVisible();
  await expect(page.getByText(specification, { exact: true })).toBeVisible();
  await expect(linesAsWritten(page)).toHaveCount(asWrittenLines);
}
