import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// The automated part of the platform's accessibility standard, WCAG 2.2 level
// AA: the rules of axe-core that carry these tags, which are those of WCAG
// 2.0, 2.1 and 2.2 at levels A and AA. A person still checks what no tool can
// (docs/research/design-system.md).
const wcag22LevelAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The device's two colour schemes. Every look has a light and a dark one, and
// the page follows the device, so each is checked.
const schemes = ['light', 'dark'] as const;

// Runs the automated part of WCAG 2.2 level AA on the page as it is now, in
// the light and in the dark scheme, and expects no violation in either. The
// test opens the page, and waits for what it shows, before it calls this.
// The page is left in the device's own scheme again afterwards.
export async function expectAccessible(page: Page): Promise<void> {
  try {
    for (const colorScheme of schemes) {
      await test.step(`WCAG 2.2 level AA, in the ${colorScheme} scheme`, async () => {
        await page.emulateMedia({ colorScheme });
        // A control whose colours change with a transition takes a moment to
        // reach the new scheme's, and a contrast measured during it is of
        // neither scheme.
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((animation) => animation.finished)),
        );
        const { violations } = await new AxeBuilder({ page })
          .withTags(wcag22LevelAA)
          .analyze();

        expect(
          violations.map(({ id, help, nodes }) => ({
            rule: id,
            help,
            where: nodes.map(({ target }) => target.join(' ')),
          })),
          `the page in the ${colorScheme} scheme breaks none of the rules`,
        ).toEqual([]);
      });
    }
  } finally {
    await page.emulateMedia({ colorScheme: null });
  }
}
