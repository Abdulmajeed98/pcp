import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  addressIn,
  expectADifferentTextInEachLanguage,
  fetchWithNoBrowser,
  layoutOf,
  readInEveryLanguage,
} from './languages';

// The credit ODC-By 1.0 asks for (CAT-9). The platform's data comes from
// BuildCores OpenDB at the last commit released under that licence. The
// commit and the two addresses are written out here, and not read from the
// platform's code, so that a credit that points elsewhere fails here.
const openDb = 'BuildCores OpenDB';
const licence = 'ODC Attribution License';
const openDbAtThePinnedCommit =
  'https://github.com/buildcores/buildcores-open-db/tree/ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf';
const licenceAddress = 'https://opendatacommons.org/licenses/by/1-0/';

// The credit, in the footer every Shopper page shares.
function credit(page: Page): Locator {
  return page.getByRole('contentinfo').getByTestId('credit');
}

// The credit's text as the browser shows it, once it is there.
async function readTheCredit(page: Page): Promise<string> {
  await expect(credit(page)).toBeVisible();
  return credit(page).innerText();
}

test('the first page and the "not found" screen credit BuildCores OpenDB in their footer, in each language, and the first page does in what the server sends', async ({
  page,
}) => {
  const credits = await readInEveryLanguage(page, '', async (language) => {
    const sent = await fetchWithNoBrowser(page.request, addressIn(language));
    expect(sent.text, 'the server sends the credit').toContain(openDb);
    expect(sent.text).toContain(licence);

    return readTheCredit(page);
  });
  expectADifferentTextInEachLanguage(credits);

  // Next sends an address that matches no page as a bare document, and the
  // browser draws the "not found" screen, frame and footer, by script. That
  // screen's credit is read in the browser only (`languages`, ticket 02).
  const onTheMissingPage = await readInEveryLanguage(
    page,
    '/no-such-page',
    () => readTheCredit(page),
    { drawnByScript: true },
  );
  expectADifferentTextInEachLanguage(onTheMissingPage);
});

// The two names are English in every language, each a link to its source,
// each with a left-to-right direction of its own and kept apart from the
// sentence around it, so that a Kurdish or an Arabic sentence cannot reorder
// it.
async function expectTheNamesKeptApartAndLinked(page: Page): Promise<void> {
  for (const [name, address] of [
    [openDb, openDbAtThePinnedCommit],
    [licence, licenceAddress],
  ]) {
    const link = credit(page).getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('href', address);
    const kept = link.locator('bdi');
    await expect(kept).toHaveText(name);
    expect(await layoutOf(kept), `${name} keeps its own direction`).toEqual({
      direction: 'ltr',
      keptApart: true,
    });
  }
}

test('the credit\'s two names keep their own direction in each language, and link to OpenDB at the pinned commit and to the licence, on the first page and the "not found" screen, and in what the server sends', async ({
  page,
}) => {
  await readInEveryLanguage(page, '', async (language) => {
    const sent = await fetchWithNoBrowser(page.request, addressIn(language));
    expect(sent.links).toEqual(
      expect.arrayContaining([
        { leadsTo: openDbAtThePinnedCommit, text: openDb },
        { leadsTo: licenceAddress, text: licence },
      ]),
    );

    await expectTheNamesKeptApartAndLinked(page);
  });

  await readInEveryLanguage(
    page,
    '/no-such-page',
    () => expectTheNamesKeptApartAndLinked(page),
    { drawnByScript: true },
  );
});

// The photographs a page shows, each credited on that page (DESIGN.md's The
// photographs, and The footer's credit): by its title and its author, kept in
// English and apart from the sentence around them, its title a link to its
// source, and by its licence, a link to the licence. They are written out
// here, and not read from the platform's code, so that a credit that points
// elsewhere fails here. The home page shows three, and the not-found page
// one.
const ccBy2 = 'https://creativecommons.org/licenses/by/2.0/';
const ccBy4 = 'https://creativecommons.org/licenses/by/4.0/';
const redLitMotherboard = {
  source: 'https://commons.wikimedia.org/w/index.php?curid=186624319',
  licence: ccBy2,
};
const builtPc = {
  source: 'https://commons.wikimedia.org/w/index.php?curid=147760057',
  licence: ccBy4,
};
const caseConnectors = {
  source: 'https://commons.wikimedia.org/w/index.php?curid=196551757',
  licence: ccBy2,
};

// The photographs' credits on the page, each by where its two links lead,
// once each is checked to keep its English apart.
async function readThePhotographsCredits(
  page: Page,
): Promise<{ source: string; licence: string }[]> {
  const credits = page
    .getByRole('contentinfo')
    .getByTestId('photograph-credits')
    .getByRole('listitem');
  await expect(credits.first()).toBeVisible();

  const read: { source: string; licence: string }[] = [];
  for (const credit of await credits.all()) {
    for (const kept of await credit.locator('bdi').all()) {
      expect(await layoutOf(kept), 'its English keeps its own direction').toEqual({
        direction: 'ltr',
        keptApart: true,
      });
    }
    const [source, licence] = await credit
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    read.push({ source, licence });
  }
  return read;
}

test('each photograph a page shows is credited on it, in each language: its title and author kept in English, its title a link to its source, and its licence a link to the licence', async ({
  page,
}) => {
  const onTheFirstPage = await readInEveryLanguage(page, '', () =>
    readThePhotographsCredits(page),
  );
  for (const credits of onTheFirstPage.values()) {
    expect(credits).toEqual([redLitMotherboard, builtPc, caseConnectors]);
  }

  const onTheMissingPage = await readInEveryLanguage(
    page,
    '/no-such-page',
    () => readThePhotographsCredits(page),
    { drawnByScript: true },
  );
  for (const credits of onTheMissingPage.values()) expect(credits).toEqual([builtPc]);
});

test('the first page, with its credits, meets the automated part of WCAG 2.2 level AA in each language, in light and in dark', async ({
  page,
}) => {
  await readInEveryLanguage(page, '', async () => {
    await expect(credit(page)).toBeVisible();
    await expectAccessible(page);
  });
});
