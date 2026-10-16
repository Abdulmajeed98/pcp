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
test("the credit's two names keep their own direction in each language, and link to OpenDB at the pinned commit and to the licence, in the browser and in what the server sends", async ({
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
  });
});

test('the first page, with its credit, meets the automated part of WCAG 2.2 level AA in each language, in light and in dark', async ({
  page,
}) => {
  await readInEveryLanguage(page, '', async () => {
    await expect(credit(page)).toBeVisible();
    await expectAccessible(page);
  });
});
