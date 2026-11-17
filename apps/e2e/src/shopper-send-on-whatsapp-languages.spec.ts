import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  type BuildCategory,
  type BuildPart,
  buildPageIn,
  keepInTheCookieByHand,
  pick,
  vendorLineOf,
} from './build-page';
import { catalogHeading, createAMadeUpPart } from './catalog';
import { setThePlatformRate } from './currencies';
import {
  authorizationOfTheDevelopmentAdmin,
  openTheDashboardAs,
} from './development-logins';
import type { VendorLoginDetails } from './keycloak-screens';
import {
  expectADifferentTextInEachLanguage,
  expectNoSidewaysScroll,
  expectPageIn,
  type Language,
  languages,
} from './languages';
import { aWordUniqueToTheRun } from './made-up';
import { film, filmFromTheFirstFrame, snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { apiUrl, shopperUrl } from './platform';
import { findOnTheReferrals, referralCountOf } from './referrals';
import {
  answerWhatsAppsChatHere,
  noWhatsAppNumberOf,
  sendButtonOf,
  sendFormOf,
  sendOnWhatsApp,
  sendRefused,
  theChat,
  whatsAppDigitsOf,
} from './send-on-whatsapp';
import {
  aFreshBrowser,
  shareFromTheBuildPage,
  sharedBuildPageIn,
  theSharedBuildAsStored,
} from './shared-build-page';
import {
  aMadeUpMobileNumber,
  aMadeUpVendorThatHasLoggedIn,
  createAMadeUpVendor,
  type MadeUpVendor,
} from './vendors';

// "Send on WhatsApp" on each Vendor's line of the second price view, on the
// Build page and on the Shared Build page (SHR-5, SHR-6, success criterion
// 8), in a window as wide as a narrow phone, in Kurdish, Arabic and English.
// Each test makes its own made-up Vendors, some with a WhatsApp number and
// one without, and its own made-up Parts and Offers, through the API, and
// picks its Build from its own browser. The chat is never opened: the test
// reads the address the new tab is sent to and answers it itself, so that
// nothing leaves the machine. It compares what it reads with what the API
// answers, and never quotes a translation.
const [kurdish, , english] = languages;

// A net under the routes that answer the forms: this file's browser finds
// WhatsApp's hosts nowhere, so that no line of it can open a chat, even one
// a route missed.
test.use({
  launchOptions: {
    args: [
      '--host-resolver-rules=MAP wa.me 127.0.0.1:9, MAP api.whatsapp.com 127.0.0.1:9, MAP web.whatsapp.com 127.0.0.1:9',
    ],
  },
});

// The word unique to this run in its Parts' names.
const word = aWordUniqueToTheRun();

// The run's made-up Parts: a CPU, a motherboard, a RAM kit and a GPU.
let cpu: BuildPart;
let board: BuildPart;
let kit: BuildPart;
let gpu: BuildPart;

// The run's Vendors: two with a WhatsApp number whose Logins have logged in,
// so that each one's portal can be read, and one that gave none.
let alpha: VendorLoginDetails;
let bravo: VendorLoginDetails;
let charlie: MadeUpVendor;

// The Build the lines pick, and its values as the API freezes them, in the
// catalog's order of Categories.
async function theBuild(page: Page): Promise<void> {
  for (const part of [gpu, cpu, board, kit, kit]) await pick(page, part);
}
const frozenValues = () => [cpu.id, board.id, `${kit.id}:2`, gpu.id];

// The development Admin, logged in to the dashboard once a test, in a
// context of its own that runs script, since a context made in a hook takes
// the options of the worker's first line (browse ticket 10); its page is
// the Admin console's.
let admin: { context: BrowserContext; page: Page; authorization: string } | undefined;

async function asTheAdmin<Done>(
  browser: Browser,
  work: (request: APIRequestContext, authorization: string, page: Page) => Promise<Done>,
): Promise<Done> {
  if (admin === undefined) {
    const context = await browser.newContext({ javaScriptEnabled: true });
    const page = await context.newPage();
    admin = {
      context,
      page,
      authorization: await authorizationOfTheDevelopmentAdmin(page),
    };
  }
  return work(admin.context.request, admin.authorization, admin.page);
}

async function closeTheAdmin(): Promise<void> {
  await admin?.context.close();
  admin = undefined;
}

test.afterEach(closeTheAdmin);
test.afterAll(closeTheAdmin);

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  const withWhatsApp = () => ({ whatsAppNumber: aMadeUpMobileNumber() });
  alpha = await aMadeUpVendorThatHasLoggedIn(browser, withWhatsApp());
  bravo = await aMadeUpVendorThatHasLoggedIn(browser, withWhatsApp());
  await asTheAdmin(browser, async (request, authorization) => {
    await setThePlatformRate(request, authorization, 1500);
    charlie = await createAMadeUpVendor(request, authorization);
    const aPart = async (category: BuildCategory, what: string) => {
      const { id } = await createAMadeUpPart(request, authorization, {}, category, {
        name: `Made-up test ${what} ${word}`,
      });
      return { id, category };
    };
    cpu = await aPart('cpu', 'CPU');
    board = await aPart('motherboard', 'motherboard');
    kit = await aPart('ram', 'RAM kit');
    gpu = await aPart('gpu', 'GPU');

    const offer = (vendorId: string, part: BuildPart, details: object) =>
      addAnOffer(request, authorization, vendorId, part.id, details);
    await offer(alpha.vendorId, cpu, { iqdPrice: 300_000 });
    await offer(alpha.vendorId, board, { usdPrice: '200.00' });
    await offer(alpha.vendorId, kit, { iqdPrice: 100_000 });
    await offer(alpha.vendorId, gpu, { iqdPrice: 500_000 });
    await offer(bravo.vendorId, cpu, { iqdPrice: 320_000 });
    await offer(bravo.vendorId, gpu, { iqdPrice: 510_000 });
    await offer(charlie.id, kit, { iqdPrice: 90_000 });
  });
  await closeTheAdmin();
});

// A Vendor's Referral count, as the API answers it to the Admin.
async function countOf(browser: Browser, vendorId: string): Promise<number> {
  return asTheAdmin(browser, (request, authorization) =>
    referralCountOf(request, authorization, vendorId),
  );
}

// The words of a chat's first line once the Vendor's name is taken out,
// which hold no price: no figure and no currency's mark.
function expectNoPriceIn(sentence: string, vendorName: string): void {
  const words = sentence.replace(vendorName, '');
  expect(words, 'the message names no price').not.toMatch(/[0-9٠-٩۰-۹]|IQD|\$|≈/);
}

// What a tap opened: a new tab to WhatsApp's chat with the Vendor's number,
// its message one sentence naming the Vendor as it wrote its name, then the
// link on a line of its own. Gives back the first line and the link.
async function expectTheChat(
  { tab, chat: address }: { tab: Page; chat: string | undefined },
  vendor: VendorLoginDetails,
): Promise<{ sentence: string; link: string }> {
  const chat = theChat(address);
  expect(chat.number).toBe(await whatsAppDigitsOf(tab.request, vendor.vendorId));
  expect(chat.lines, 'one sentence, then the link').toHaveLength(2);
  const [sentence, link] = chat.lines as [string, string];
  expect(sentence).toContain(vendor.vendorName);
  expectNoPriceIn(sentence, vendor.vendorName);
  return { sentence, link };
}

// The Vendor's count as the Admin console's Referrals screen and the
// Vendor's own portal show it, each the API's, and another made-up
// Vendor's portal showing its own count, none, unchanged (success criterion
// 8, SHR-7).
async function expectTheCountsShown(
  browser: Browser,
  sentTo: VendorLoginDetails,
  another: VendorLoginDetails,
): Promise<void> {
  const counted = await asTheAdmin(browser, async (request, authorization, page) => {
    await expect(catalogHeading(page)).toBeVisible();
    const count = await referralCountOf(request, authorization, sentTo.vendorId);
    const row = await findOnTheReferrals(
      page,
      request,
      authorization,
      { id: sentTo.vendorId, name: sentTo.vendorName },
      'the first page',
    );
    await expect(row.getByTestId('referral-count')).toHaveText(String(count));
    expect(await referralCountOf(request, authorization, another.vendorId)).toBe(0);
    return count;
  });

  const own = await browser.newContext({ javaScriptEnabled: true });
  try {
    const page = await own.newPage();
    await openTheDashboardAs(page, sentTo);
    await expect(page.getByTestId('referrals').getByTestId('referral-count')).toHaveText(
      String(counted),
    );
  } finally {
    await own.close();
  }

  const others = await browser.newContext({ javaScriptEnabled: true });
  try {
    const page = await others.newPage();
    await openTheDashboardAs(page, another);
    const said = page.getByTestId('referrals');
    await expect(said.getByTestId('no-referrals')).toBeVisible();
    await expect(said.getByTestId('referral-count')).toHaveCount(0);
  } finally {
    await others.close();
  }
}

// A Shared Build page's address, its language and its identifier.
const aSharedBuildPage =
  /^http:\/\/localhost:3000\/(ckb|ar|en)\/builds\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

test("in Kurdish, Arabic and English, a tap on a Vendor's Send on WhatsApp on the Build page opens a new tab to WhatsApp's chat with its number, its message holding the Shared Build's link in the page's language, and raises that Vendor's count by one, as the Admin's Referrals screen and its own portal show, and another Vendor's not", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const asked = await answerWhatsAppsChatHere(page.context());
  await theBuild(page);
  const sentences = new Map<Language, string>();
  const sharedBuilds = new Set<string>();

  for (const language of languages) {
    await test.step(`in ${language.name}`, async () => {
      const before = await countOf(browser, alpha.vendorId);
      await page.goto(buildPageIn(language));
      await expectPageIn(page, language);
      await expect(sendFormOf(page, alpha.vendorId)).toHaveAttribute('target', '_blank');
      await expect(sendFormOf(page, alpha.vendorId)).toHaveAttribute('method', 'post');
      await expect(sendFormOf(page, alpha.vendorId)).toHaveAttribute(
        'action',
        `/${language.tag}/build/send`,
      );
      // Its name for a screen reader names the Vendor as it wrote its name.
      await expect(sendButtonOf(page, alpha.vendorId)).toHaveAccessibleName(
        new RegExp(alpha.vendorName),
      );
      await expectNoSidewaysScroll(page);

      const sent = await sendOnWhatsApp(page, alpha.vendorId, asked);
      const { sentence, link } = await expectTheChat(sent, alpha);
      // The link is the Shared Build page's, in the page's language, and
      // the Shared Build is the Build the page holds.
      const [, linksLanguage, sharedBuildId] = aSharedBuildPage.exec(link) ?? [];
      expect(linksLanguage).toBe(language.tag);
      expect(
        (await theSharedBuildAsStored(page.request, sharedBuildId ?? '')).part,
      ).toEqual(frozenValues());
      sentences.set(language, sentence);
      sharedBuilds.add(sharedBuildId ?? '');
      await sent.tab.close();
      // The page the tap was made on stays where it was.
      await expect(page).toHaveURL(buildPageIn(language));

      expect(await countOf(browser, alpha.vendorId)).toBe(before + 1);
    });
  }

  expectADifferentTextInEachLanguage(sentences);
  // One Build, one Shared Build, whichever language sent it.
  expect(sharedBuilds.size).toBe(1);
  expect(asked).toHaveLength(3);
  await expectTheCountsShown(browser, alpha, bravo);
});

test("in Kurdish, Arabic and English, a tap on the Shared Build page opens WhatsApp's chat with the Vendor, holding this Shared Build's link in the page's language, and raises that Vendor's count by one, as the Admin's Referrals screen and its own portal show, and another Vendor's not", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  await theBuild(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
  const sentences = new Map<Language, string>();

  const fresh = await aFreshBrowser(browser);
  try {
    const asked = await answerWhatsAppsChatHere(fresh);
    const reader = await fresh.newPage();
    for (const language of languages) {
      await test.step(`in ${language.name}`, async () => {
        const before = await countOf(browser, alpha.vendorId);
        const link = sharedBuildPageIn(language.tag, sharedBuildId);
        await reader.goto(link);
        await expectPageIn(reader, language);
        await expect(sendFormOf(reader, alpha.vendorId)).toHaveAttribute(
          'action',
          `/${language.tag}/builds/${sharedBuildId}/send`,
        );
        await expectNoSidewaysScroll(reader);

        const sent = await sendOnWhatsApp(reader, alpha.vendorId, asked);
        const chat = await expectTheChat(sent, alpha);
        expect(chat.link).toBe(link);
        sentences.set(language, chat.sentence);
        await sent.tab.close();
        await expect(reader).toHaveURL(link);

        expect(await countOf(browser, alpha.vendorId)).toBe(before + 1);
      });
    }
  } finally {
    await fresh.close();
  }

  expectADifferentTextInEachLanguage(sentences);
  // The Shared Build itself never changed.
  expect((await theSharedBuildAsStored(page.request, sharedBuildId)).part).toEqual(
    frozenValues(),
  );
  await expectTheCountsShown(browser, alpha, bravo);
});

test('a Vendor that gave no WhatsApp number has no button, its line saying so, and its name still leads to its Vendor page, on both pages', async ({
  page,
}) => {
  await theBuild(page);
  const sharedBuildId = await shareFromTheBuildPage(page, kurdish.tag);

  for (const address of [
    buildPageIn(english),
    sharedBuildPageIn(english.tag, sharedBuildId),
  ]) {
    await page.goto(address);
    await expect(sendButtonOf(page, alpha.vendorId)).toBeVisible();
    await expect(sendButtonOf(page, charlie.id)).toHaveCount(0);
    await expect(noWhatsAppNumberOf(page, charlie.id)).not.toHaveText('');
    await expect(noWhatsAppNumberOf(page, alpha.vendorId)).toHaveCount(0);
    await expect(
      vendorLineOf(page, charlie.id).locator(`a[href="/en/vendors/${charlie.id}"]`),
    ).toHaveText(charlie.name);
  }
});

test('with script, a tap is not taken again while the first is being handled: the button says it is busy, and a second sending of its form is no second Referral', async ({
  page,
  browser,
}) => {
  const asked = await answerWhatsAppsChatHere(page.context());
  await theBuild(page);
  const before = await countOf(browser, alpha.vendorId);
  await page.goto(buildPageIn(english));
  const button = sendButtonOf(page, alpha.vendorId);
  const idleName = await button.getAttribute('aria-label');

  const opened = page.waitForEvent('popup');
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).not.toHaveAccessibleName(idleName ?? '');
  const tab = await opened;
  // Sent again while busy, as a second tap or Enter would send it.
  let another = false;
  page.on('popup', () => {
    another = true;
  });
  await button.evaluate((own: HTMLButtonElement) => own.form?.requestSubmit(own));
  await expect.poll(() => asked.length).toBe(1);
  await tab.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  expect(another, 'no second tab').toBe(false);
  expect(asked, 'one chat').toHaveLength(1);
  expect(await countOf(browser, alpha.vendorId)).toBe(before + 1);
});

test.describe('with scripts switched off', () => {
  test.use({ javaScriptEnabled: false });

  test('sending works, and each tap is a Referral', async ({ page, browser }) => {
    const asked = await answerWhatsAppsChatHere(page.context());
    await theBuild(page);
    const before = await countOf(browser, alpha.vendorId);
    await page.goto(buildPageIn(kurdish));
    expect(
      await page.evaluate(() => matchMedia('(scripting: none)').matches),
      'the browser runs no script',
    ).toBe(true);

    for (let tap = 1; tap <= 2; tap++) {
      const sent = await sendOnWhatsApp(page, alpha.vendorId, asked);
      const { link } = await expectTheChat(sent, alpha);
      expect(aSharedBuildPage.exec(link)?.[1]).toBe(kurdish.tag);
      await sent.tab.close();
      expect(await countOf(browser, alpha.vendorId)).toBe(before + tap);
    }
  });
});

test.describe('refusals come back to the page the form was sent from, with the reason in the address, which the page says, and no chat is opened', () => {
  test('a Vendor deactivated since the Build page was drawn', async ({ page, browser }) => {
    const asked = await answerWhatsAppsChatHere(page.context());
    const dora = await asTheAdmin(browser, async (request, authorization) => {
      const vendor = await createAMadeUpVendor(request, authorization, {
        whatsAppNumber: aMadeUpMobileNumber(),
      });
      await addAnOffer(request, authorization, vendor.id, gpu.id, { iqdPrice: 520_000 });
      return vendor;
    });
    await theBuild(page);
    await page.goto(buildPageIn(english));
    await expect(sendButtonOf(page, dora.id)).toBeVisible();

    await asTheAdmin(browser, async (request, authorization) => {
      const switchedOff = await request.post(`${apiUrl}/v1/vendors/${dora.id}/deactivate`, {
        headers: { authorization },
      });
      expect(switchedOff.status()).toBe(200);
    });
    const { tab } = await sendOnWhatsApp(page, dora.id, asked);
    await expect(tab).toHaveURL(
      `${buildPageIn(english)}?refused=notReachable&vendor=${dora.id}#vendor-${dora.id}`,
    );
    // The Vendor is no longer on the page, so the refusal stands at the head
    // of the Vendors' sheet, where the address's anchor finds it.
    await expect(vendorLineOf(tab, dora.id)).toHaveCount(0);
    await expect(sendRefused(tab)).toHaveAttribute('id', `vendor-${dora.id}`);
    await expect(sendRefused(tab)).not.toHaveText('');
    expect(asked).toEqual([]);
    expect(await countOf(browser, dora.id)).toBe(0);
  });

  test('a Vendor without a WhatsApp number since the Shared Build page was drawn', async ({
    page,
    browser,
  }) => {
    const asked = await answerWhatsAppsChatHere(page.context());
    const echo = await asTheAdmin(browser, async (request, authorization) => {
      const vendor = await createAMadeUpVendor(request, authorization, {
        whatsAppNumber: aMadeUpMobileNumber(),
      });
      await addAnOffer(request, authorization, vendor.id, cpu.id, { iqdPrice: 330_000 });
      return vendor;
    });
    await theBuild(page);
    const sharedBuildId = await shareFromTheBuildPage(page, english.tag);
    const link = sharedBuildPageIn(english.tag, sharedBuildId);
    await page.goto(link);
    await expect(sendButtonOf(page, echo.id)).toBeVisible();

    await asTheAdmin(browser, async (request, authorization) => {
      const edited = await request.put(`${apiUrl}/v1/vendors/${echo.id}`, {
        headers: { authorization },
        data: {
          name: echo.name,
          city: 'erbil',
          address: 'Made-up Street, Erbil',
          phoneNumber: echo.loginPhoneNumber,
          loginPhoneNumber: echo.loginPhoneNumber,
          whatsAppNumber: null,
        },
      });
      expect(edited.status()).toBe(200);
    });
    const { tab } = await sendOnWhatsApp(page, echo.id, asked);
    await expect(tab).toHaveURL(
      `${link}?refused=notReachable&vendor=${echo.id}#vendor-${echo.id}`,
    );
    // Its line is still there, with no button now, and says the refusal
    // under it, naming the Vendor as it wrote its name.
    await expect(noWhatsAppNumberOf(tab, echo.id)).toBeVisible();
    const said = vendorLineOf(tab, echo.id).getByTestId('send-refused');
    await expect(said).toContainText(echo.name);
    expect(asked).toEqual([]);
    expect(await countOf(browser, echo.id)).toBe(0);
  });

  test('a Build emptied since the page was drawn, and a Build the API refuses', async ({
    page,
    browser,
  }) => {
    const asked = await answerWhatsAppsChatHere(page.context());
    const before = await countOf(browser, alpha.vendorId);
    await theBuild(page);
    await page.goto(buildPageIn(english));
    const emptied = await page.request.post(`${shopperUrl}/en/build/empty`, {
      form: {},
      maxRedirects: 0,
    });
    expect(emptied.status()).toBe(303);
    const { tab: empty } = await sendOnWhatsApp(page, alpha.vendorId, asked);
    await expect(empty).toHaveURL(`${buildPageIn(english)}?refused=nothingToShare`);
    await expect(empty.getByTestId('share-refused')).not.toHaveText('');
    await empty.close();

    await theBuild(page);
    await page.goto(buildPageIn(english));
    // A RAM kit filed under the CPU, as only a cookie edited by hand holds it.
    await keepInTheCookieByHand(page, `cpu:${kit.id}`);
    const { tab: refused } = await sendOnWhatsApp(page, alpha.vendorId, asked);
    await expect(refused).toHaveURL(`${buildPageIn(english)}?refused=notReadable`);
    await expect(refused.getByTestId('build-refused')).toBeVisible();

    expect(asked).toEqual([]);
    expect(await countOf(browser, alpha.vendorId)).toBe(before);
  });

  test('an API that does not answer: the page reads the reason from its address and says it under the Vendor’s line', async ({
    page,
  }) => {
    await theBuild(page);
    await page.goto(
      `${buildPageIn(english)}?refused=notOpened&vendor=${alpha.vendorId}#vendor-${alpha.vendorId}`,
    );
    const said = vendorLineOf(page, alpha.vendorId).getByTestId('send-refused');
    await expect(said).not.toHaveText('');
    await expect(said).toBeInViewport();
    await expect(sendRefused(page)).toHaveCount(1);
  });
});

test('the Build page and the Shared Build page with their buttons, a Vendor with no WhatsApp number and a refusal said, pass WCAG 2.2 level AA in the light and the dark scheme', async ({
  page,
}) => {
  await theBuild(page);
  const sharedBuildId = await shareFromTheBuildPage(page, english.tag);

  for (const language of [kurdish, english]) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(
        `${buildPageIn(language)}?refused=notReachable&vendor=${alpha.vendorId}#vendor-${alpha.vendorId}`,
      );
      await expect(sendRefused(page)).toBeVisible();
      await expect(noWhatsAppNumberOf(page, charlie.id)).toBeVisible();
      await expectAccessible(page);

      await page.goto(sharedBuildPageIn(language.tag, sharedBuildId));
      await expect(sendButtonOf(page, alpha.vendorId)).toBeVisible();
      await expectAccessible(page);
    });
  }
});

// Motion 12 (DESIGN.md's What moves): a press, then a busy button, whose
// words change at once while it holds its width, so that nothing beside or
// under it moves; and a refused send's line printing in under its Vendor's
// line 150 ms after the first paint, there from the first frame with
// reduced motion, its space the page's from the first frame (the No Snap
// Rule).
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Send on WhatsApp moves as Motion 12 says, with nothing snapping, ${reducedMotion === 'reduce' ? 'with reduced motion' : 'with full motion'}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await answerWhatsAppsChatHere(page.context());
    await theBuild(page);
    await page.emulateMedia({ reducedMotion });

    await test.step('the button turns busy in place, its width held', async () => {
      await page.goto(buildPageIn(english));
      await page.addStyleTag({ content: '* { overflow-anchor: none }' });
      await sendButtonOf(page, alpha.vendorId).scrollIntoViewIfNeeded();
      const look = (ids: { sent: string; next: string }) => {
        const line = (id: string) =>
          document.querySelector(`[data-testid="build-vendor"][data-vendor="${id}"]`);
        const button = line(ids.sent)?.querySelector('[data-testid="send-on-whatsapp"]');
        const box = button?.getBoundingClientRect();
        const next = line(ids.next)?.getBoundingClientRect();
        return {
          width: box?.width ?? 0,
          busy: button?.getAttribute('aria-busy') === 'true',
          next: next === undefined ? null : next.top + window.scrollY,
        };
      };
      const opened = page.waitForEvent('popup');
      const frames = await film(
        page,
        look,
        () => sendButtonOf(page, alpha.vendorId).click(),
        {
          forMs: 1200,
          arg: { sent: alpha.vendorId, next: bravo.vendorId },
        },
      );
      await (await opened).close();
      expect(frames.at(-1)?.drawn.busy, 'the button is busy').toBe(true);
      expect(new Set(frames.map(({ drawn }) => Math.round(drawn.width))).size).toBe(1);
      expect(
        snapsOf(
          'the next Vendor’s line',
          frames.map(({ at, drawn }) => ({ at, value: drawn.next })),
        ),
      ).toEqual([]);
    });

    await test.step('a refused send prints in under its line, and nothing moves around it', async () => {
      const refusal = `${buildPageIn(english)}?refused=notOpened&vendor=${alpha.vendorId}#vendor-${alpha.vendorId}`;
      const frames = await filmFromTheFirstFrame(
        page,
        () => {
          const said = document.querySelector('[data-testid="send-refused"]');
          const line = said?.closest('[data-testid="build-vendor"]');
          const next = line?.nextElementSibling;
          const shift = said === null ? null : getComputedStyle(said).translate;
          return {
            // How far the refusal is from its place, down, as it prints in.
            shift:
              shift === null || shift === undefined || shift === 'none'
                ? 0
                : Number.parseFloat(shift.split(' ')[1] ?? '0'),
            // Where the next Vendor's line starts, from the start of the
            // refusal's own line, and the refusal's own height.
            under:
              line === null || line === undefined || next === null || next === undefined
                ? null
                : next.getBoundingClientRect().top - line.getBoundingClientRect().top,
            height: said === null ? null : said.getBoundingClientRect().height,
            // The page's fonts arriving move every line once, the refusal's
            // too, so a frame is judged once they have arrived.
            fonts: document.fonts.status === 'loaded',
          };
        },
        async () => {
          await page.goto(refusal);
        },
        { forMs: 3000 },
      );
      await expect(sendRefused(page)).toBeVisible();
      const judged = frames.filter(({ drawn }) => drawn.fonts && drawn.under !== null);
      expect(judged.length, 'frames drawn once the fonts arrived').toBeGreaterThan(20);
      const moving = judged.some(({ drawn }) => drawn.shift < -0.5);
      expect(
        moving,
        reducedMotion === 'reduce'
          ? 'the refusal is there at once'
          : 'the refusal prints in',
      ).toBe(reducedMotion !== 'reduce');
      expect(
        snapsOf(
          'the line under the refusal',
          judged.map(({ at, drawn }) => ({ at, value: drawn.under })),
        ),
      ).toEqual([]);
      expect(
        new Set(judged.map(({ drawn }) => Math.round(drawn.height ?? 0))).size,
        'the refusal holds its space from the first frame',
      ).toBe(1);
    });
  });
}
