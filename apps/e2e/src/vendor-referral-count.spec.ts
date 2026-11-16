import { expect, test } from '@playwright/test';

import { expectAccessible } from './accessibility';
import { catalogHeading, createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { expectNoSidewaysScroll, narrowWindow } from './languages';
import { film, snapsOf } from './motion-film';
import { apiUrl, dashboardUrl } from './platform';
import { recordAReferral, shareABuildOf } from './referrals';
import { aMadeUpMobileNumber, createAMadeUpVendor, type MadeUpVendor } from './vendors';

// The Vendor's Referral count on the Offers screen arrives as a value does
// in its sketch's place (the dashboard's DESIGN.md, Motion 6 and 10, sharing
// ticket 03): the line's mark and a one-line sketch first, then the sentence
// fading in over the sketch fading out, while the line's height follows,
// so that nothing below it jumps (the No Snap Rule), with reduced motion
// too. The test holds the count's answer until the screen below is drawn,
// and watches as the Admin acting as a made-up Vendor, on a phone.
test.use({ viewport: narrowWindow });

let vendor: MadeUpVendor;

test.beforeEach(async ({ page, request }) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
  vendor = await createAMadeUpVendor(request, authorization, {
    whatsAppNumber: aMadeUpMobileNumber(),
  });
  const part = await createAMadeUpPart(request, authorization);
  const sharedBuild = await shareABuildOf(request, [part.id]);
  for (let tap = 0; tap < 3; tap++) {
    await recordAReferral(request, sharedBuild, vendor.id);
  }
});

// What a frame shows of the arrival: how opaque the sentence is, once it is
// there, and where what is below the line is drawn, in the page's own
// coordinates.
interface Arrival {
  sentence: number | null;
  below: number | null;
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`the count fades in where its sketch was, and what is below it moves in no frame, ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`${apiUrl}/v1/vendors/${vendor.id}/referral-count`, async (route) => {
      await held;
      await route.continue();
    });
    await page.goto(`${dashboardUrl}/vendors/${vendor.id}/portal`);
    const said = page.getByTestId('referrals');
    await expect(page.getByTestId('no-offers')).toBeVisible();
    await expect(said.getByTestId('referrals-sketch')).toBeVisible();
    await expect(said.getByTestId('referral-count')).toHaveCount(0);
    const sketched = (await said.boundingBox())?.height ?? 0;

    const frames = await film<Arrival>(
      page,
      () => {
        const sentence = document.querySelector('[data-testid="referral-sentence"]');
        const below = document.querySelector('[data-testid="no-offers"]');
        return {
          sentence:
            sentence === null
              ? null
              : Number(
                  getComputedStyle(sentence.closest('[data-shown]') ?? sentence).opacity,
                ),
          below: below === null ? null : below.getBoundingClientRect().top + window.scrollY,
        };
      },
      async () => {
        release();
        await expect(said.getByTestId('referral-count')).toHaveText('3');
      },
      { forMs: 2000 },
    );

    const fading = frames.filter(
      ({ drawn }) =>
        drawn.sentence !== null && drawn.sentence > 0.05 && drawn.sentence < 0.95,
    );
    expect(fading.length, 'the sentence fades in over several frames').toBeGreaterThan(2);
    expect(
      snapsOf(
        'what is below the line',
        frames.map(({ at, drawn }) => ({ at, value: drawn.below })),
      ),
    ).toEqual([]);
    // Where the sentence takes another height than its sketch, as on a
    // phone where it wraps, what is below it moved, smoothly.
    const arrived = (await said.boundingBox())?.height ?? 0;
    const tops = frames.map(({ drawn }) => drawn.below ?? 0);
    expect(Math.round(Math.max(...tops) - Math.min(...tops))).toBe(
      Math.round(Math.abs(arrived - sketched)),
    );
    await expectNoSidewaysScroll(page);
  });
}

test('the count meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
  page,
}) => {
  await page.goto(`${dashboardUrl}/vendors/${vendor.id}/portal`);
  await expect(page.getByTestId('referrals').getByTestId('referral-count')).toHaveText('3');

  await expectAccessible(page);
});

test.describe('at a desk’s width', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the count stands under the title, on one line, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    await page.goto(`${dashboardUrl}/vendors/${vendor.id}/portal`);
    const said = page.getByTestId('referrals');
    await expect(said.getByTestId('referral-count')).toHaveText('3');

    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    const line = await said.boundingBox();
    expect(line?.y ?? 0).toBeGreaterThan((title?.y ?? 0) + (title?.height ?? 0) - 1);
    expect(Math.round(line?.height ?? 0)).toBeLessThanOrEqual(32);
    await expectAccessible(page);
  });
});
