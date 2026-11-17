import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  type AnsweredBuild,
  buildPageIn,
  type BuildCategory,
  type BuildPart,
  emptyTheBuild,
  lineOf,
  lowestAtOf,
  pick,
  priceOf,
  removeOf,
  theBuildAsAnswered,
  theFramesCount,
  theSlip,
  theTotal,
  vendorLineOf,
  vendorsListed,
} from './build-page';
import { addAPhotoTo } from './category-page';
import { createAMadeUpPart } from './catalog';
import { setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { shownPriceText } from './home-page';
import {
  addressIn,
  expectNoSidewaysScroll,
  expectPageIn,
  expectTheSameInEveryLanguage,
  type Language,
  languages,
  layoutOf,
  readInEveryLanguage,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, filmFromTheFirstFrame, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { apiUrl, shopperUrl } from './platform';
import {
  aFreshBrowser,
  partsListed,
  shareFromTheBuildPage,
  sharedBuildPageIn,
  shareTheLinkButton,
  theCopy,
  theCopysConfirmation,
  theLink,
  theRulesClosingLine,
  theShareButton,
  theSharedBuildAsStored,
  thisIsYourBuild,
} from './shared-build-page';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The word unique to this run in its Parts' names.
const word = aWordUniqueToTheRun();

// The Platform Rate the run sets, behind every Converted Price it reads.
const rate = 1500;

// The run's made-up Parts, made through the API: a CPU, a motherboard with a
// photo, the first Part with one in the catalog's order, two RAM kits, a
// GPU and a drive.
let cpu: BuildPart & { name: string };
let board: BuildPart & { name: string };
let kit: BuildPart & { name: string };
let otherKit: BuildPart & { name: string };
let gpu: BuildPart & { name: string };
let drive: BuildPart & { name: string };
let boardsPhoto: string;

// The run's two Vendors, and the Offer of the CPU whose price a line changes.
let alpha: MadeUpVendor;
let bravo: MadeUpVendor;
let alphasCpu: string;

// Works with the API as the development Admin, who logs in through the
// dashboard, in a context of its own that runs script: a context made in a
// hook takes the options of the first line a worker runs, which may be one
// with scripts switched off (browse ticket 10).
async function asTheAdmin(
  browser: Browser,
  work: (request: APIRequestContext, authorization: string) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ javaScriptEnabled: true });
  try {
    const authorization = await authorizationOfTheDevelopmentAdmin(await context.newPage());
    await work(context.request, authorization);
  } finally {
    await context.close();
  }
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await asTheAdmin(browser, async (request, authorization) => {
    await setThePlatformRate(request, authorization, rate);
    [alpha, bravo] = [
      await createAMadeUpVendor(request, authorization),
      await createAMadeUpVendor(request, authorization),
    ];
    const aPart = async (category: BuildCategory, what: string) => {
      const name = `Made-up test ${what} ${word}`;
      const { id } = await createAMadeUpPart(request, authorization, {}, category, {
        name,
      });
      return { id, category, name };
    };
    cpu = await aPart('cpu', 'CPU');
    board = await aPart('motherboard', 'motherboard');
    kit = await aPart('ram', 'RAM kit');
    otherKit = await aPart('ram', 'other RAM kit');
    gpu = await aPart('gpu', 'GPU');
    drive = await aPart('storage', 'drive');
    boardsPhoto = await addAPhotoTo(request, authorization, board.id);

    const offer = (vendor: MadeUpVendor, part: BuildPart, details: object) =>
      addAnOffer(request, authorization, vendor.id, part.id, details);
    alphasCpu = await offer(alpha, cpu, { iqdPrice: 300_000 });
    await offer(bravo, cpu, { iqdPrice: 320_000 });
    await offer(alpha, board, { usdPrice: '200.00' });
    await offer(alpha, kit, { iqdPrice: 100_000 });
    await offer(bravo, kit, { iqdPrice: 90_000 });
    await offer(bravo, otherKit, { iqdPrice: 80_000 });
    await offer(alpha, gpu, { iqdPrice: 500_000 });
    await offer(bravo, gpu, { iqdPrice: 510_000 });
    await offer(alpha, drive, { iqdPrice: 60_000 });
  });
});

// The Build the lines share, picked from the page's own browser, its GPU
// first, so that the browser's Build is in another order than the
// catalog's, which the Shared Build keeps.
async function aBuildToShare(page: Page): Promise<void> {
  for (const part of [gpu, cpu, board, kit, kit]) await pick(page, part);
}

// The Shared Build's frozen values, in the catalog's order of Categories.
const sharedValues = () => [cpu.id, board.id, `${kit.id}:2`, gpu.id];

// Every price a page shows, compared with what the API answers, never with a
// quoted translation: each Part's Lowest Price times its quantity and its
// Vendor, the total across Vendors, and each Vendor's total, in the API's
// order (SHR-2).
async function expectThePricesAnswered(page: Page, answered: AnsweredBuild): Promise<void> {
  for (const part of answered.parts) {
    if (part.lowestPrice === null) continue;
    await expect(priceOf(page, part.id)).toHaveText(
      shownPriceText(part.lowestPrice.timesQuantity),
    );
    await expect(lowestAtOf(page, part.id)).toHaveAttribute(
      'data-vendor',
      part.lowestPrice.vendor.id,
    );
  }
  await expect(theTotal(page)).toHaveText(shownPriceText(answered.totalAcrossVendors!));
  expect(await vendorsListed(page)).toEqual(answered.vendors.map(({ id }) => id));
  for (const vendor of answered.vendors) {
    await expect(vendorLineOf(page, vendor.id).getByTestId('vendor-total')).toHaveText(
      vendor.total === null ? '—' : shownPriceText(vendor.total),
    );
  }
}

test("in Kurdish and English, sharing a Build lands on its Shared Build page, whose link a fresh browser opens with the same Parts and today's prices, and the sender's browser is told it holds this Build", async ({
  page,
  browser,
}) => {
  await aBuildToShare(page);
  const answered = await theBuildAsAnswered(page.request, sharedValues());
  const ids = new Map<Language, string>();

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      const sharedBuildId = await shareFromTheBuildPage(page, language.tag);
      ids.set(language, sharedBuildId);
      await expectPageIn(page, language);
      const link = sharedBuildPageIn(language.tag, sharedBuildId);
      await expect(page).toHaveURL(link);
      // The link is the page's address, in the sender's language.
      await expect(theLink(page)).toHaveText(link);
      // The API froze the Build's Parts in the catalog's order of Categories.
      expect((await theSharedBuildAsStored(page.request, sharedBuildId)).part).toEqual(
        sharedValues(),
      );
      // The sender's browser holds this very Build, so it is told so, with
      // no copy, though its Parts were picked in another order.
      await expect(thisIsYourBuild(page)).toBeVisible();
      await expect(theCopy(page)).toHaveCount(0);
      // Its slip's one action is Share the link; the link and "This is your
      // Build" stand on the sheet (the owner's answer of 17 November 2026).
      await expect(theSlip(page).getByTestId('share-the-link-button')).toBeAttached();
      await expect(theSlip(page).getByTestId('the-link')).toHaveCount(0);
      await expect(theSlip(page).getByTestId('this-is-your-build')).toHaveCount(0);
      // The page already says the Build is theirs, so the rules' sheet does
      // not close by telling them to copy it (the code review's fixes).
      await expect(theRulesClosingLine(page)).toHaveCount(0);
      expect(await theFramesCount(page)).toBe(4);
      await expectNoSidewaysScroll(page);

      const fresh = await aFreshBrowser(browser);
      try {
        const reader = await fresh.newPage();
        await reader.goto(link);
        await expectPageIn(reader, language);
        expect(await partsListed(reader)).toEqual(answered.parts.map(({ id }) => id));
        await expectThePricesAnswered(reader, answered);
        // A browser with no Build of its own copies with no question.
        await expect(thisIsYourBuild(reader)).toHaveCount(0);
        await expect(theCopy(reader)).toBeVisible();
        await expect(theCopy(reader).locator('summary')).toHaveCount(0);
        // The copy is the slip's one action; the link and Share the link
        // stand on the sheet.
        await expect(theSlip(reader).getByTestId('copy-into-my-build')).toBeVisible();
        await expect(theSlip(reader).getByTestId('share-the-link-button')).toHaveCount(0);
        await expect(theLink(reader)).toBeVisible();
        // A reader's rules' sheet closes with how to change a Part: copy it.
        await expect(theRulesClosingLine(reader)).not.toHaveText('');
        await expect(reader.getByTestId('when-shared')).not.toHaveText('');
        await expect(reader.locator('[data-stamp="shared"]')).toBeAttached();
        await expectNoSidewaysScroll(reader);
      } finally {
        await fresh.close();
      }
    });
  }
  // One Build, one Shared Build, whichever language it was shared in.
  expect(ids.get(kurdish)).toBe(ids.get(english));
});

test('after the Admin changes the price of one of its Offers, the Shared Build page shows the new price', async ({
  page,
  browser,
}) => {
  await aBuildToShare(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
  const before = await theBuildAsAnswered(page.request, sharedValues());
  await expectThePricesAnswered(page, before);

  await asTheAdmin(browser, async (request, authorization) => {
    const changed = await request.put(
      `${apiUrl}/v1/vendors/${alpha.id}/offers/${alphasCpu}`,
      {
        headers: { authorization },
        data: { inStock: true, iqdPrice: 250_000 },
      },
    );
    expect(changed.status()).toBe(200);
  });
  const after = await theBuildAsAnswered(page.request, sharedValues());
  expect(after.totalAcrossVendors).not.toEqual(before.totalAcrossVendors);

  await page.goto(sharedBuildPageIn(english.tag, sharedBuildId));
  await expect(priceOf(page, cpu.id)).toHaveText('250,000 IQD');
  await expectThePricesAnswered(page, after);
  // The Shared Build itself never changed.
  expect((await theSharedBuildAsStored(page.request, sharedBuildId)).part).toEqual(
    sharedValues(),
  );
});

test('a fresh browser copies the Shared Build and changes the copy, and the link still shows the Shared Build unchanged; with a Build of its own the copy asks once first', async ({
  page,
  browser,
}) => {
  await aBuildToShare(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
  const link = sharedBuildPageIn(english.tag, sharedBuildId);
  const listed = await partsListed(page);

  const fresh = await aFreshBrowser(browser);
  try {
    const reader = await fresh.newPage();
    await reader.goto(link);
    await test.step('copied at once into an empty Build', async () => {
      await theCopy(reader).click();
      await expect(reader).toHaveURL(buildPageIn(english));
      expect(await partsListed(reader)).toEqual(listed);
      expect(await theFramesCount(reader)).toBe(4);
    });

    await test.step('the copy changed, the GPU removed', async () => {
      const sent = reader.waitForResponse((response) =>
        response.url().endsWith('/build/remove'),
      );
      await removeOf(reader, gpu.id).click();
      await sent;
      await expect(lineOf(reader, gpu.id)).toHaveCount(0);
    });

    await test.step('the link still shows the Shared Build as it was shared', async () => {
      await reader.goto(link);
      expect(await partsListed(reader)).toEqual(listed);
      expect((await theSharedBuildAsStored(reader.request, sharedBuildId)).part).toEqual(
        sharedValues(),
      );
      await expect(thisIsYourBuild(reader)).toHaveCount(0);
    });

    await test.step('with a Build of its own, the copy asks once first', async () => {
      await theCopy(reader).locator('summary').click();
      await expect(theCopysConfirmation(reader)).toBeVisible();
      await theCopy(reader).getByTestId('keep-mine').click();
      await expect(theCopy(reader)).not.toHaveAttribute('open');
      await expect(reader).toHaveURL(link);

      await theCopy(reader).locator('summary').click();
      await theCopysConfirmation(reader).click();
      await expect(reader).toHaveURL(buildPageIn(english));
      expect(await partsListed(reader)).toEqual(listed);
    });

    await test.step('the copy is now the browser’s Build, so its link says so', async () => {
      await reader.goto(link);
      await expect(thisIsYourBuild(reader)).toBeVisible();
    });
  } finally {
    await fresh.close();
  }
});

test('sharing an unchanged Build again gives the same address, and sharing after a change gives a new one, the old link still showing what it showed', async ({
  page,
}) => {
  await aBuildToShare(page);
  const first = await shareFromTheBuildPage(page, english.tag);
  const again = await shareFromTheBuildPage(page, english.tag);
  expect(again).toBe(first);

  await pick(page, otherKit);
  const changed = await shareFromTheBuildPage(page, english.tag);
  expect(changed).not.toBe(first);
  expect((await theSharedBuildAsStored(page.request, changed)).part).toEqual([
    cpu.id,
    board.id,
    `${kit.id}:2`,
    `${otherKit.id}:1`,
    gpu.id,
  ]);

  await page.goto(sharedBuildPageIn(english.tag, first));
  await expect(lineOf(page, otherKit.id)).toHaveCount(0);
  expect(await partsListed(page)).toEqual([cpu.id, board.id, kit.id, gpu.id]);
  // The browser now holds the changed Build, so the first link offers to
  // copy it, with its one confirmation.
  await expect(thisIsYourBuild(page)).toHaveCount(0);
  await expect(theCopy(page).locator('summary')).toBeVisible();
});

test('an empty Build has no share button, and a share sent all the same comes back saying there is nothing to share', async ({
  page,
}) => {
  await page.goto(buildPageIn(english));
  await expect(theShareButton(page)).toHaveCount(0);

  const answer = await page.request.post(`${shopperUrl}/en/build/share`, {
    form: {},
    maxRedirects: 0,
  });
  expect(answer.status()).toBe(303);
  expect(answer.headers().location).toBe('/en/build?refused=nothingToShare');
  await page.goto(`${shopperUrl}${answer.headers().location}`);
  await expect(page.getByTestId('share-refused')).not.toHaveText('');
});

test("an unknown Shared Build answers the not-found page with 404 in the page's language", async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    const unknown = sharedBuildPageIn(language.tag, '00000000-0000-4000-8000-00000000dead');
    const response = await page.goto(unknown);
    expect(response?.status()).toBe(404);
    await expectPageIn(page, language);
    const notAnIdentifier = await page.request.get(addressIn(language, '/builds/not-one'));
    expect(notAnIdentifier.status()).toBe(404);
  }
});

test.describe('with scripts switched off', () => {
  test.use({ javaScriptEnabled: false });

  test('sharing, and copying with its confirmation, work, and the link is shown as text to select', async ({
    page,
    browser,
  }) => {
    await aBuildToShare(page);
    const sharedBuildId = await shareFromTheBuildPage(page, kurdish.tag);
    expect(
      await page.evaluate(() => matchMedia('(scripting: none)').matches),
      'the browser runs no script',
    ).toBe(true);
    const link = sharedBuildPageIn(kurdish.tag, sharedBuildId);
    await expect(theLink(page)).toHaveText(link);
    await expect(theLink(page)).toHaveCSS('user-select', 'all');
    // The button that shares or copies the link needs script.
    await expect(shareTheLinkButton(page)).toBeHidden();

    const fresh = await aFreshBrowser(browser, false);
    try {
      const reader = await fresh.newPage();
      await pick(reader, drive);
      await reader.goto(link);
      await theCopy(reader).locator('summary').click();
      await theCopy(reader).getByTestId('keep-mine').click();
      await expect(reader).toHaveURL(link);
      await expect(theCopy(reader)).not.toHaveAttribute('open');

      await theCopy(reader).locator('summary').click();
      await theCopysConfirmation(reader).click();
      await expect(reader).toHaveURL(buildPageIn(kurdish));
      expect(await partsListed(reader)).toEqual([cpu.id, board.id, kit.id, gpu.id]);
    } finally {
      await fresh.close();
    }
  });
});

// What a crawler reads of a page: its head as the server sends it, with no
// cookie, to WhatsApp's own reader, which builds the preview of a link.
async function headOf(request: APIRequestContext, address: string): Promise<string> {
  const answer = await request.get(address, {
    headers: { 'user-agent': 'WhatsApp/2.24.6.77 A' },
  });
  expect(answer.status()).toBe(200);
  const html = await answer.text();
  return html.slice(0, html.indexOf('</head>'));
}

function tagsIn(head: string, tag: RegExp): string[] {
  return [...head.matchAll(tag)].map(([, value]) =>
    value
      .replace(/&amp;/g, '&')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  );
}

test("in Kurdish and English, a Shared Build page's head, read with no cookie as a crawler would, holds its title, a description naming its CPU and GPU with no price, and its image, and asks not to be indexed", async ({
  page,
  playwright,
}) => {
  await aBuildToShare(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
  const crawler = await playwright.request.newContext();
  try {
    const titles = new Map<Language, string>();
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        const link = sharedBuildPageIn(language.tag, sharedBuildId);
        const head = await headOf(crawler, link);
        const [title] = tagsIn(head, /<title>([^<]*)<\/title>/g);
        const [description] = tagsIn(
          head,
          /<meta\s+name="description"\s+content="([^"]*)"/gi,
        );
        // The title names the Build by how many Parts it holds.
        expect(title).toContain('4');
        expect(description).toContain(cpu.name);
        expect(description).toContain(gpu.name);
        expect(`${title} ${description}`, 'no price').not.toMatch(
          /IQD|\$|≈|300,000|250,000|500,000|90,000/,
        );
        titles.set(language, title);
        expect(tagsIn(head, /<meta\s+name="robots"\s+content="([^"]*)"/gi)).toEqual([
          'noindex',
        ]);
        expect(tagsIn(head, /<link\s+rel="canonical"\s+href="([^"]*)"/gi)).toEqual([link]);
        expect(tagsIn(head, /<meta\s+property="og:title"\s+content="([^"]*)"/gi)).toEqual([
          title,
        ]);
        expect(
          tagsIn(head, /<meta\s+property="og:description"\s+content="([^"]*)"/gi),
        ).toEqual([description]);
        // The photo of its first Part with one, in the catalog's order.
        expect(tagsIn(head, /<meta\s+property="og:image"\s+content="([^"]*)"/gi)).toEqual([
          `${shopperUrl}/photos/${boardsPhoto.split('/').at(-1)}`,
        ]);
      });
    }
    expect(titles.get(kurdish)).not.toBe(titles.get(english));
  } finally {
    await crawler.dispose();
  }
});

// LANG-2, LANG-3 and LANG-5 on the Shared Build page, in all three
// languages: right to left in Kurdish and Arabic, every number in Western
// digits, Part names in English, and nothing scrolling sideways.
test('the Shared Build page is right to left in Kurdish and Arabic, with every number in Western digits, Part names in English, and nothing scrolling sideways', async ({
  page,
}) => {
  await aBuildToShare(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);

  const read = await readInEveryLanguage(page, `/builds/${sharedBuildId}`, async () => {
    const name = lineOf(page, cpu.id).locator('[data-item-name] bdi');
    await expect(name).toHaveText(cpu.name);
    return {
      parts: await partsListed(page),
      total: await theTotal(page).textContent(),
      prices: await page.getByTestId('part-price').allTextContents(),
      vendors: await vendorsListed(page),
      nameLayout: await layoutOf(name),
      linkLayout: await layoutOf(theLink(page)),
    };
  });
  expectTheSameInEveryLanguage(
    new Map(
      [...read].map(([language, { parts, total, prices, vendors }]) => [
        language,
        { parts, total, prices, vendors },
      ]),
    ),
  );
  for (const each of read.values()) {
    expect(each.nameLayout).toEqual({ direction: 'ltr', keptApart: true });
    expect(each.linkLayout).toEqual({ direction: 'ltr', keptApart: true });
  }
});

test('the Shared Build page with its confirmation open, and the Build page with its share button, pass WCAG 2.2 level AA in the light and the dark scheme', async ({
  page,
}) => {
  await aBuildToShare(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
  await pick(page, drive);

  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(sharedBuildPageIn(language.tag, sharedBuildId));
      await theCopy(page).locator('summary').click();
      await expect(theCopysConfirmation(page)).toBeVisible();
      await expectAccessible(page);

      await page.goto(buildPageIn(language));
      await expect(theShareButton(page)).toBeVisible();
      await expectAccessible(page);
    });
  }

  await test.step('a This-is-your-Build slip', async () => {
    const own = await shareFromTheBuildPage(page, kurdish.tag);
    await expect(thisIsYourBuild(page)).toBeVisible();
    expect(own).not.toBe(sharedBuildId);
    await expectAccessible(page);
  });
});

// Motion 12 (DESIGN.md's What moves): the Shared Build page arrives printed,
// its date stamp landing under its title; the copy's confirmation and Empty
// the Build's open and fold, in 150 ms each way with reduced motion too, so
// that nothing below them snaps (the No Snap Rule); and Copy the link turns
// to "Link copied" in place, its words cross-fading and its width held.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`the sharing pieces move as Motion 12 says, with nothing snapping, ${reducedMotion === 'reduce' ? 'with reduced motion' : 'with full motion'}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await aBuildToShare(page);
    const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
    const link = sharedBuildPageIn(english.tag, sharedBuildId);
    await pick(page, drive);
    await page.emulateMedia({ reducedMotion });

    await test.step('the date stamp lands as the page arrives', async () => {
      const frames = await filmFromTheFirstFrame(
        page,
        () =>
          document
            .getAnimations()
            .some(
              (animation) =>
                (animation as CSSAnimation).animationName === 'stamp' &&
                (
                  (animation.effect as KeyframeEffect | null)?.target as Element | null
                )?.matches('[data-stamp="shared"]') === true,
            ),
        async () => {
          await page.goto(link);
        },
        { forMs: 6000 },
      );
      expect(
        frames.some(({ drawn }) => drawn),
        reducedMotion === 'reduce'
          ? 'the stamp is down from the first frame'
          : 'the stamp lands',
      ).toBe(reducedMotion !== 'reduce');
    });

    // The confirmation's height and what stands under it, through a film.
    const look = () => {
      const top = (selector: string) => {
        const element = document.querySelector(selector);
        return element === null
          ? null
          : element.getBoundingClientRect().top + window.scrollY;
      };
      const height = (selector: string) => {
        const element = document.querySelector(selector);
        return element === null ? null : element.getBoundingClientRect().height;
      };
      return {
        copy: height('[data-testid="copy-into-my-build"]'),
        link: top('[data-testid="share-the-link"]'),
        empty: height('[data-testid="empty-the-build"]'),
      };
    };
    const along = (
      frames: { at: number; drawn: ReturnType<typeof look> }[],
      value: keyof ReturnType<typeof look>,
    ) => frames.map(({ at, drawn }) => ({ at, value: drawn[value] }));
    const steps = (
      frames: { drawn: ReturnType<typeof look> }[],
      value: keyof ReturnType<typeof look>,
    ) => new Set(frames.map(({ drawn }) => Math.round(drawn[value] ?? 0))).size;

    await test.step("the copy's confirmation opens with nothing under it snapping", async () => {
      await page.addStyleTag({ content: '* { overflow-anchor: none }' });
      await theCopy(page).locator('summary').scrollIntoViewIfNeeded();
      const frames = await film(
        page,
        look,
        () => theCopy(page).locator('summary').click(),
        {
          forMs: 2000,
        },
      );
      await expect(theCopysConfirmation(page)).toBeVisible();
      expect(snapsOf('the link under the confirmation', along(frames, 'link'))).toEqual([]);
      expect(
        steps(frames, 'copy'),
        'the confirmation opens over many frames',
      ).toBeGreaterThan(5);
    });

    await test.step("Empty the Build's confirmation opens with nothing under it snapping", async () => {
      await page.goto(buildPageIn(english));
      await page.addStyleTag({ content: '* { overflow-anchor: none }' });
      await emptyTheBuild(page).locator('summary').scrollIntoViewIfNeeded();
      const frames = await film(
        page,
        look,
        () => emptyTheBuild(page).locator('summary').click(),
        { forMs: 2000 },
      );
      await expect(emptyTheBuild(page).getByTestId('empty-confirm')).toBeVisible();
      expect(
        steps(frames, 'empty'),
        'the confirmation opens over many frames',
      ).toBeGreaterThan(5);
    });

    await test.step('Copy the link turns to Link copied in place, its width held', async () => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: shopperUrl,
      });
      await page.addInitScript(() => {
        // A browser with no share sheet, which copies the link instead.
        delete (Navigator.prototype as { share?: unknown }).share;
      });
      await page.goto(link);
      const button = shareTheLinkButton(page);
      await expect(button).toHaveAttribute('data-way', 'copy');
      const widthBefore = (await button.boundingBox())?.width;
      const words = () => {
        const copied = document.querySelector(
          '[data-testid="share-the-link-button"] [data-words="copied"]',
        );
        const button = document.querySelector('[data-testid="share-the-link-button"]');
        return {
          copied: copied === null ? 0 : Number(getComputedStyle(copied).opacity),
          width: button?.getBoundingClientRect().width ?? 0,
        };
      };
      const frames = await film(page, words, () => button.click(), { forMs: 1200 });
      await expect(button.locator('[data-words="copied"]')).not.toHaveAttribute(
        'aria-hidden',
      );
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
      expect(new Set(frames.map(({ drawn }) => Math.round(drawn.width)))).toEqual(
        new Set([Math.round(widthBefore ?? 0)]),
      );
      // The words cross-fade, with reduced motion too, never in one frame.
      expect(
        frames.some(({ drawn }) => drawn.copied > 0.05 && drawn.copied < 0.95),
        'the words cross-fade',
      ).toBe(true);
    });
  });
}
