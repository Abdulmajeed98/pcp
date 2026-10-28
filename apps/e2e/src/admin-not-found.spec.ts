import { expect, type Locator, type Page, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { catalogHeading, catalogUrl } from './catalog';
import { logInToTheDashboard } from './development-logins';
import { expectCentredInTheWindow, expectTheEmptyState } from './empty-state';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { dashboardUrl } from './platform';

// The Admin console's "not found" screen, at an address that matches none of
// its screens, such as an old link. As the dashboard's DESIGN.md draws an
// Offer that no longer exists (the redesign, ticket 13), it is the empty
// state: centred in the sheet, a plain icon above its title, one sentence,
// and an outlined link to the Catalog.

const deskWindow = { width: 1280, height: 800 };

function title(page: Page): Locator {
  return page.getByRole('main').getByRole('heading', { level: 1 });
}

for (const { width, viewport } of [
  { width: 'on a phone', viewport: narrowWindow },
  { width: "on a screen as wide as a desk's", viewport: deskWindow },
]) {
  test.describe(width, () => {
    test.use({ viewport });

    test('an address that matches no screen shows the empty state, its plain icon above a centred title and a sentence, with a way to the Catalog', async ({
      page,
    }) => {
      await logInToTheDashboard(page, undefined, `${dashboardUrl}/no-such-screen`);

      await expect(title(page)).toHaveText('Screen not found');
      await expectTheEmptyState(page.getByRole('main'), title(page));
      await expectCentredInTheWindow(page.getByRole('main'), title(page));
      await expect(
        page
          .getByRole('main')
          .getByText('This address matches no screen of the Admin console.'),
      ).toBeVisible();
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);

      await page.getByRole('main').getByRole('link', { name: 'Open the Catalog' }).click();
      await expect(page).toHaveURL(catalogUrl);
      await expect(catalogHeading(page)).toBeVisible();
    });
  });
}
