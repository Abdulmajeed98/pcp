import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import { createAMadeUpPart, type MadeUpPart } from './catalog';
import { setThePlatformRate } from './currencies';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { shownPriceText, theNumber } from './home-page';
import {
  addressIn,
  expectPageIn,
  expectTheSameInEveryLanguage,
  type Language,
  languages,
  layoutOf,
  linesAsDrawn,
  readInEveryLanguage,
} from './languages';
import { film, filmFromTheFirstFrame, snapsOf, type Filmed } from './motion-film';
import { addAnOffer } from './offers';
import { offerOf, switchTheVendor } from './part-page';
import { shopperUrl } from './platform';
import {
  aMadeUpMobileNumber,
  createAMadeUpVendor,
  inIraqsOwnForm,
  type MadeUpVendor,
} from './vendors';
import {
  contactLink,
  groupsListed,
  lookAtTheVendorPage,
  offerOfThePart,
  partsListed,
  tearOffTabs,
  theCityNamed,
  type TheVendorPage,
  theVendorsOffers,
  vendorsOffers,
  whatTheOffersSay,
} from './vendor-page';

const [kurdish, , english] = languages;
// The ticket's lines are checked in Kurdish and in English, right to left
// and left to right, in a window as wide as a narrow phone.
const kurdishAndEnglish = [kurdish, english] as const;

// The Platform Rate the run sets, behind every Converted Price it reads.
const rate = 1500;

// What the run's Vendor with every contact detail wrote, as a Vendor in
// Erbil may: its address in Sorani on two lines, its shop's number in
// Arabic-Indic digits, as it typed them, which the page shows as written
// (LANG-4); its opening hours in English, a WhatsApp number, an Instagram
// name, typed with an @ and capitals as a Vendor may type it, and a place in
// Erbil. Its name is in Latin script, so that it runs left to right inside a
// Kurdish page.
const address = 'شەقامی نموونە، ژمارە ١٢\nبازاڕی خەیاڵی، هەولێر';
const openingHours = 'Saturday to Thursday, 10:00 to 21:00\nFriday closed';
const whatsAppNumber = aMadeUpMobileNumber();
const instagramName = `made_up.v${Date.now().toString().slice(-8)}`;
const mapLocation = { latitude: 36.1911744, longitude: 44.0094145 };

// The run's Vendors: one with every detail and Offers in three Categories;
// one that gave its phone number alone; one with no Visible Offer; one
// whose Offers fill more than a page; and one that alone offers a Part, to
// be deactivated.
let everyDetail: MadeUpVendor;
let phoneAlone: MadeUpVendor;
let noOffers: MadeUpVendor;
let paged: MadeUpVendor;
let alone: MadeUpVendor;

// Every-detail's Offers: two CPUs, the one quoted in dollars alone converted
// in dinars, 299.99 $ at the run's rate being 449,985 dinars, shown as
// ≈ 450,000 and so first; RAM; and a GPU out of stock with no warranty.
let cpuInDinars: MadeUpPart;
let cpuInDollars: MadeUpPart;
let ram: MadeUpPart;
let gpu: MadeUpPart;
// The Part the lone Vendor alone offers.
let lonePart: MadeUpPart;
// Paged's 21 CPUs, one more than a page holds.
let pagedParts: MadeUpPart[];

const vendorPage = (vendor: MadeUpVendor) => `/vendors/${vendor.id}`;

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
  test.setTimeout(180_000);
  await asTheAdmin(browser, async (request, authorization) => {
    await setThePlatformRate(request, authorization, rate);
    everyDetail = await createAMadeUpVendor(request, authorization, {
      address,
      openingHours,
      whatsAppNumber,
      instagramName: `@${instagramName.toUpperCase()}`,
      mapLocation,
    });
    phoneAlone = await createAMadeUpVendor(request, authorization);
    noOffers = await createAMadeUpVendor(request, authorization, {
      whatsAppNumber: aMadeUpMobileNumber(),
      mapLocation,
    });
    paged = await createAMadeUpVendor(request, authorization);
    alone = await createAMadeUpVendor(request, authorization);

    cpuInDinars = await createAMadeUpPart(request, authorization);
    cpuInDollars = await createAMadeUpPart(request, authorization);
    ram = await createAMadeUpPart(request, authorization, {}, 'ram');
    gpu = await createAMadeUpPart(request, authorization, {}, 'gpu');
    await addAnOffer(request, authorization, everyDetail.id, gpu.id, {
      iqdPrice: 900_000,
      inStock: false,
    });
    await addAnOffer(request, authorization, everyDetail.id, ram.id, {
      iqdPrice: 120_000,
      warrantyMonths: 24,
    });
    await addAnOffer(request, authorization, everyDetail.id, cpuInDinars.id, {
      iqdPrice: 500_000,
      warrantyMonths: 12,
    });
    await addAnOffer(request, authorization, everyDetail.id, cpuInDollars.id, {
      usdPrice: '299.99',
    });
    await addAnOffer(request, authorization, phoneAlone.id, cpuInDinars.id, {
      iqdPrice: 510_000,
    });

    lonePart = await createAMadeUpPart(request, authorization);
    await addAnOffer(request, authorization, alone.id, lonePart.id, { iqdPrice: 300_000 });

    pagedParts = [];
    for (let place = 0; place < 21; place++) {
      const part = await createAMadeUpPart(request, authorization);
      await addAnOffer(request, authorization, paged.id, part.id, {
        iqdPrice: 100_000 + place * 1000,
      });
      pagedParts.push(part);
    }
  });
});

test("in Kurdish and English, a Part page's Offer leads to its Vendor's page, which names the Vendor as it wrote its name", async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, `/parts/${cpuInDinars.id}`));
      await offerOf(page, everyDetail.id)
        .getByRole('link', { name: everyDetail.name })
        .click();
      await expect(page).toHaveURL(addressIn(language, vendorPage(everyDetail)));
      await expectPageIn(page, language);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(everyDetail.name);
    });
  }
});

test("in Kurdish and English, the Vendor's city is named in the page's language, and its address and opening hours are shown as it wrote them, each line in its own direction", async ({
  page,
}) => {
  const cities = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, vendorPage(everyDetail)));
      const city = await theCityNamed(page);
      expect(city).not.toBe('');
      await expect(page.getByTestId('what-the-vendor-is')).toContainText(city);
      cities.set(language, city);

      const writtenAddress = page.getByTestId('vendor-address').locator('bdi');
      await expect(writtenAddress).toHaveText(address);
      expect(await layoutOf(writtenAddress)).toEqual({ direction: 'rtl', keptApart: true });
      const writtenHours = page.getByTestId('vendor-opening-hours').locator('bdi');
      await expect(writtenHours).toHaveText(openingHours);
      expect(await layoutOf(writtenHours)).toEqual({ direction: 'ltr', keptApart: true });
      // Each line drawn as it was written, left to right; the line break the
      // Vendor typed is drawn at the end of its line.
      expect((await linesAsDrawn(writtenHours)).map((line) => line.trim())).toEqual(
        openingHours.split('\n'),
      );
    });
  }
  expect(cities.get(kurdish)).not.toBe(cities.get(english));
});

test("in Kurdish and English, the phone number calls the shop, the WhatsApp number opens a chat with it, the Instagram name opens its profile and the map opens Google Maps in a new tab, each link named in the page's language", async ({
  page,
}) => {
  const callWords = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, vendorPage(everyDetail)));
      const phone = inIraqsOwnForm(everyDetail.loginPhoneNumber);
      const whatsApp = `+964${whatsAppNumber.slice(1)}`;

      const call = contactLink(page, 'call');
      await expect(call).toHaveAttribute('href', `tel:${everyDetail.loginPhoneNumber}`);
      await expect(call).toContainText(phone);
      const chat = contactLink(page, 'whatsApp');
      await expect(chat).toHaveAttribute('href', `https://wa.me/${whatsApp.slice(1)}`);
      await expect(chat).toContainText(inIraqsOwnForm(whatsApp));
      const profile = contactLink(page, 'instagram');
      await expect(profile).toHaveAttribute(
        'href',
        `https://www.instagram.com/${instagramName}/`,
      );
      await expect(profile).toContainText(`@${instagramName}`);
      const map = contactLink(page, 'map');
      await expect(map).toHaveAttribute(
        'href',
        'https://www.google.com/maps/search/?api=1&query=36.1911744%2C44.0094145',
      );
      await expect(map).toHaveAttribute('target', '_blank');

      // The coupon's tear-off tabs are each a call, by the same number.
      const tabs = tearOffTabs(page).getByRole('link');
      await expect(tabs).toHaveCount(6);
      for (const tab of await tabs.all()) {
        await expect(tab).toHaveAttribute('href', `tel:${everyDetail.loginPhoneNumber}`);
        await expect(tab).toHaveText(phone);
      }

      // Nothing is loaded from Google, nor from any other site (BRW-4).
      const elsewhere = await page.evaluate(
        (origin) =>
          performance
            .getEntriesByType('resource')
            .map(({ name }) => name)
            .filter((name) => !name.startsWith(origin)),
        shopperUrl,
      );
      expect(elsewhere).toEqual([]);

      callWords.set(language, (await call.innerText()).replace(phone, '').trim());
    });
  }
  expect(callWords.get(kurdish)).not.toBe(callWords.get(english));
});

test('in Kurdish and English, a detail the Vendor has not given is not shown, cell or line', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, vendorPage(phoneAlone)));
      await expect(contactLink(page, 'call')).toHaveAttribute(
        'href',
        `tel:${phoneAlone.loginPhoneNumber}`,
      );
      await expect(page.getByTestId('contact-links').getByRole('link')).toHaveCount(1);
      for (const kind of ['whatsApp', 'instagram', 'map'] as const) {
        await expect(contactLink(page, kind)).toHaveCount(0);
      }
      await expect(page.getByTestId('vendor-opening-hours')).toHaveCount(0);
    });
  }
});

test("in Kurdish and English, the Vendor's Offers are grouped by Category in the API's order, under each Category's name, each with its Shown Price, stock, warranty and Confirmation, and each leads to its Part page", async ({
  page,
  request,
}) => {
  const answered = await theVendorsOffers(request, everyDetail.id, 'IQD');
  expect(answered.content.map(({ part }) => part.id)).toEqual([
    cpuInDollars.id,
    cpuInDinars.id,
    ram.id,
    gpu.id,
  ]);
  const headings = new Map<Language, string[]>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, vendorPage(everyDetail)));
      expect(await groupsListed(page)).toEqual([
        { category: 'cpu', parts: [cpuInDollars.id, cpuInDinars.id] },
        { category: 'ram', parts: [ram.id] },
        { category: 'gpu', parts: [gpu.id] },
      ]);
      headings.set(
        language,
        await page.locator('[data-testid^="offers-of-"] h3').allInnerTexts(),
      );

      await expect(
        offerOfThePart(page, cpuInDollars.id).getByTestId('shown-price'),
      ).toHaveText('≈ 450,000 IQD');
      await expect(
        offerOfThePart(page, cpuInDinars.id).getByTestId('shown-price'),
      ).toHaveText(shownPriceText({ currency: 'IQD', amount: '500000', converted: false }));
      await expect(
        offerOfThePart(page, cpuInDollars.id).getByTestId('offer-quoted'),
      ).toContainText('299.99 $');
      // In stock or out of stock, in words, on every Offer's line.
      for (const part of [cpuInDollars, cpuInDinars, ram]) {
        await expect(
          offerOfThePart(page, part.id).getByTestId('offer-in-stock'),
        ).not.toBeEmpty();
      }
      await expect(
        offerOfThePart(page, gpu.id).getByTestId('offer-out-of-stock'),
      ).not.toBeEmpty();
      await expect(offerOfThePart(page, gpu.id).getByTestId('offer-in-stock')).toHaveCount(
        0,
      );
      // The warranty in months, left out where the Vendor states none.
      await expect(offerOfThePart(page, ram.id).getByTestId('offer-warranty')).toHaveText(
        theNumber(24),
      );
      await expect(offerOfThePart(page, gpu.id).getByTestId('offer-warranty')).toHaveCount(
        0,
      );
      // Each was confirmed today, as it was added, and says so with no count.
      await expect(offerOfThePart(page, ram.id).getByTestId('offer-confirmed')).toHaveText(
        /^\D+$/,
      );
      // What "≈" means closes the sheet, since a price on it is converted.
      await expect(page.getByTestId('what-approximately-means')).toBeVisible();

      // Each Offer leads to its Part page.
      for (const part of [cpuInDollars, cpuInDinars, ram, gpu]) {
        await expect(
          offerOfThePart(page, part.id).getByRole('link', { name: part.name }),
        ).toHaveAttribute('href', `/${language.tag}/parts/${part.id}`);
      }
      await offerOfThePart(page, ram.id).getByRole('link', { name: ram.name }).click();
      await expect(page).toHaveURL(addressIn(language, `/parts/${ram.id}`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(ram.name);
    });
  }
  expect(headings.get(kurdish)).toHaveLength(3);
  expect(headings.get(kurdish)).not.toEqual(headings.get(english));
});

test('in Kurdish and English, the Offers are paged, twenty to a page, with the page in the address', async ({
  page,
  request,
}) => {
  const [first, second] = [
    await theVendorsOffers(request, paged.id, 'IQD', 0),
    await theVendorsOffers(request, paged.id, 'IQD', 1),
  ];
  expect(first.totalPages).toBe(2);
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      await page.goto(addressIn(language, vendorPage(paged)));
      expect(await partsListed(page)).toEqual(first.content.map(({ part }) => part.id));
      await expect(page.getByTestId('page-of')).toHaveText(/1\D+2/);

      const next = page.getByRole('link').and(page.locator('[rel="next"]'));
      await expect(next).toHaveAttribute(
        'href',
        `/${language.tag}/vendors/${paged.id}?page=2#offers`,
      );
      await next.click();
      await expect(page).toHaveURL(
        `${addressIn(language, vendorPage(paged))}?page=2#offers`,
      );
      await expect
        .poll(() => partsListed(page))
        .toEqual(second.content.map(({ part }) => part.id));
      await expect(page.getByTestId('page-of')).toHaveText(/2\D+2/);

      // A reload keeps the page.
      await page.reload();
      expect(await partsListed(page)).toEqual(second.content.map(({ part }) => part.id));

      // A page past the last says how many the list has and leads to the first.
      await page.goto(`${addressIn(language, vendorPage(paged))}?page=5`);
      await expect(whatTheOffersSay(page)).toHaveAttribute('data-state', 'past-the-end');
      await expect(page.getByTestId('to-the-first-page')).toHaveAttribute(
        'href',
        `/${language.tag}/vendors/${paged.id}#offers`,
      );
    });
  }
});

test('in Kurdish and English, a Vendor with no Visible Offer says so, and still shows how to reach it', async ({
  page,
}) => {
  const said = new Map<Language, string>();
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      const response = await page.goto(addressIn(language, vendorPage(noOffers)));
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(noOffers.name);
      await expect(whatTheOffersSay(page)).toHaveAttribute('data-state', 'none');
      await expect(vendorsOffers(page)).toHaveCount(0);
      said.set(language, await whatTheOffersSay(page).innerText());

      await expect(contactLink(page, 'call')).toHaveAttribute(
        'href',
        `tel:${noOffers.loginPhoneNumber}`,
      );
      await expect(contactLink(page, 'whatsApp')).toBeVisible();
      await expect(contactLink(page, 'map')).toBeVisible();
      await expect(tearOffTabs(page).getByRole('link')).toHaveCount(6);
    });
  }
  expect(said.get(kurdish)).not.toBe(said.get(english));
});

test('in Kurdish and English, deactivating the Vendor makes its page answer the not-found page with a 404, and so does the page of a Part it alone offered; reactivating it brings both back', async ({
  page,
  browser,
}) => {
  const answers = async (expected: number) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}, ${expected}`, async () => {
        const ofTheVendor = await page.goto(addressIn(language, vendorPage(alone)));
        expect(ofTheVendor?.status()).toBe(expected);
        await expectPageIn(page, language);
        if (expected === 200) {
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(alone.name);
          // Its one Offer, counted as one.
          await expect(page.locator('#offers-title')).toHaveText(theNumber(1));
          await expect(vendorsOffers(page)).toHaveCount(1);
        } else {
          await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(alone.name);
        }

        const ofThePart = await page.goto(addressIn(language, `/parts/${lonePart.id}`));
        expect(ofThePart?.status()).toBe(expected);
        await expectPageIn(page, language);
      });
    }
  };

  await answers(200);
  await asTheAdmin(browser, (request, authorization) =>
    switchTheVendor(request, authorization, alone.id, 'deactivate'),
  );
  await answers(404);
  await asTheAdmin(browser, (request, authorization) =>
    switchTheVendor(request, authorization, alone.id, 'reactivate'),
  );
  await answers(200);
});

test('in Kurdish and English, an unknown Vendor and an address that names none answer the not-found page with a 404', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    await test.step(`in ${language.name}`, async () => {
      for (const vendorId of ['00000000-0000-4000-8000-00000000dead', 'not-a-vendor']) {
        const response = await page.goto(addressIn(language, `/vendors/${vendorId}`));
        expect(response?.status(), vendorId).toBe(404);
        await expectPageIn(page, language);
      }
    });
  }
});

// The helper checks the page in all three languages: its direction, Kurdish
// and Arabic right to left, the server's page with the switch's links, every
// digit a Western one, but for what the Vendor wrote, and no sideways scroll
// at 360 pixels.
test("the Vendor page is right to left in Kurdish and Arabic, the Vendor's name in Latin script and its numbers reading left to right within it, the same in all three languages", async ({
  page,
}) => {
  const read = await readInEveryLanguage(page, vendorPage(everyDetail), async () => {
    const name = page.getByRole('heading', { level: 1 }).locator('bdi');
    expect(await layoutOf(name)).toEqual({ direction: 'ltr', keptApart: true });
    const number = contactLink(page, 'call').locator('bdi');
    expect(await layoutOf(number)).toEqual({ direction: 'ltr', keptApart: true });
    expect(await linesAsDrawn(number)).toEqual([
      inIraqsOwnForm(everyDetail.loginPhoneNumber),
    ]);

    return {
      name: await name.innerText(),
      details: await page.getByTestId('contact-links').locator('bdi').allInnerTexts(),
      prices: await page.getByTestId('shown-price').allInnerTexts(),
      parts: await partsListed(page),
    };
  });

  expectTheSameInEveryLanguage(read);
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

test("in Kurdish and English, a Vendor page's preview names the Vendor and its city in its title and description, in the page's language, with no price, read with no cookie as a crawler would", async ({
  playwright,
  page,
}) => {
  const crawler = await playwright.request.newContext();
  try {
    const descriptions = new Map<Language, string>();
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, vendorPage(everyDetail)));
        const city = await theCityNamed(page);

        const head = await headOf(crawler, addressIn(language, vendorPage(everyDetail)));
        const [title] = tagsIn(head, /<title>([^<]*)<\/title>/g);
        const [description] = tagsIn(
          head,
          /<meta\s+name="description"\s+content="([^"]*)"/gi,
        );
        expect(title).toContain(everyDetail.name);
        expect(description).toContain(everyDetail.name);
        expect(description).toContain(city);
        // No price, nor a price's mark.
        expect(description).not.toMatch(/IQD|\$|≈|450,000|500,000|120,000|900,000|299\.99/);
        descriptions.set(language, description);

        expect(tagsIn(head, /<link\s+rel="canonical"\s+href="([^"]*)"/gi)).toEqual([
          addressIn(language, vendorPage(everyDetail)),
        ]);
        for (const other of languages) {
          expect(
            tagsIn(
              head,
              new RegExp(
                `<link\\s+rel="alternate"\\s+hrefLang="${other.tag}"\\s+href="([^"]*)"`,
                'gi',
              ),
            ),
          ).toEqual([addressIn(other, vendorPage(everyDetail))]);
        }
        expect(tagsIn(head, /<meta\s+property="og:title"\s+content="([^"]*)"/gi)).toEqual([
          title,
        ]);
        expect(tagsIn(head, /<meta\s+property="og:type"\s+content="([^"]*)"/gi)).toEqual([
          'website',
        ]);
        expect(tagsIn(head, /<meta\s+property="og:url"\s+content="([^"]*)"/gi)).toEqual([
          addressIn(language, vendorPage(everyDetail)),
        ]);
        expect(
          tagsIn(head, /<meta\s+property="og:description"\s+content="([^"]*)"/gi),
        ).toEqual([description]);
      });
    }
    expect(descriptions.get(kurdish)).not.toBe(descriptions.get(english));
  } finally {
    await crawler.dispose();
  }
});

test('in Kurdish and English, a Vendor page meets the automated part of WCAG 2.2 level AA in light and in dark, with its Offers and with none', async ({
  page,
}) => {
  for (const language of kurdishAndEnglish) {
    for (const vendor of [everyDetail, noOffers]) {
      await test.step(`in ${language.name}, ${vendor === noOffers ? 'no Offer' : 'Offers'}`, async () => {
        await page.goto(addressIn(language, vendorPage(vendor)));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(vendor.name);
        await expectAccessible(page);
      });
    }
  }
});

// The motion of paper and print on a Vendor page (DESIGN.md's Motion): below
// the coupon the sheet of Offers prints as it comes into view, its prices
// settling from the end side, while the coupon stays still; a coupon's cell
// settles while it is pressed, and a tear-off tab leans from its perforation
// under the pointer and pressed. Nothing moves with reduced motion or
// without script. Each film slows every animation four times, and is judged
// by `snapsOf`.
type Frames = Filmed<TheVendorPage>[];

async function expectMotionAllowed(page: Page, allowed: boolean): Promise<void> {
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
    ),
  ).toBe(allowed);
}

// Scrolls at once, as a flick ends, so that the top of the sheet's frame is
// at the middle of the window, past the nine tenths at which it prints.
async function bringTheSheetIntoView(page: Page): Promise<void> {
  await page.evaluate(() => {
    const frame = document.querySelector('[data-testid="sheet"]')?.parentElement;
    if (frame == null) throw new Error('No sheet on the page.');
    window.scrollTo({
      top: frame.getBoundingClientRect().top + scrollY - innerHeight / 2,
      behavior: 'instant',
    });
  });
}

function printing(frames: Frames) {
  return frames.flatMap(({ at, drawn }) =>
    drawn.sheet === null || drawn.sheet.state !== 'printing'
      ? []
      : [{ at, ...drawn.sheet }],
  );
}

for (const { language, fromTheEnd } of [
  { language: english, fromTheEnd: 1 },
  { language: kurdish, fromTheEnd: -1 },
]) {
  test(`in ${language.name}, the sheet of the Vendor's Offers prints as it comes into view, its prices settling from the end side, while the coupon stays still, with nothing snapping`, async ({
    page,
  }) => {
    await page.goto(addressIn(language, vendorPage(everyDetail)), {
      waitUntil: 'networkidle',
    });
    await expectMotionAllowed(page, true);
    await expect(page.getByTestId('sheet')).toHaveAttribute('data-print', 'waiting');

    const frames = await film(
      page,
      lookAtTheVendorPage,
      () => bringTheSheetIntoView(page),
      {
        forMs: 6500,
      },
    );
    const sheet = printing(frames);
    const [first] = sheet;
    const last = sheet.at(-1) ?? first;
    expect(first.covered / first.height, 'the sheet starts covered').toBeGreaterThan(0.9);
    expect(last.covered, 'the sheet ends whole').toBe(0);
    expect(last.top - first.top, 'the sheet slides 18 pixels down').toBeCloseTo(18, 0);
    expect([
      ...snapsOf(
        "the sheet's top",
        sheet.map(({ at, top }) => ({ at, value: top })),
      ),
      ...snapsOf(
        "the sheet's covered foot",
        sheet.map(({ at, covered }) => ({ at, value: covered })),
      ),
    ]).toEqual([]);

    const prices = frames.flatMap(({ at, drawn }) =>
      drawn.price === null || drawn.sheet?.state !== 'printing'
        ? []
        : [{ at, ...drawn.price }],
    );
    const [firstPrice] = prices;
    const lastPrice = prices.at(-1) ?? firstPrice;
    expect(firstPrice.opacity, 'the price arrives unseen').toBeLessThan(0.1);
    expect(lastPrice.opacity, 'the price ends settled').toBe(1);
    expect(firstPrice.shift * fromTheEnd, 'the price comes from the end side').toBeCloseTo(
      16,
      0,
    );
    expect(lastPrice.shift).toBe(0);
    expect(
      snapsOf(
        "the price's shift",
        prices.map(({ at, shift }) => ({ at, value: shift })),
      ),
    ).toEqual([]);

    // The coupon stays where it is in the page.
    const coupons = new Set(frames.map(({ drawn }) => drawn.coupon));
    expect(coupons.size, 'the coupon does not move').toBe(1);
  });
}

// A coupon's cell settles to 0.97 while it is pressed and comes back from
// wherever it is when it is let go (Motion 8); a tear-off tab leans 2
// degrees and 3 pixels under the mouse, and 5 degrees and 6 pixels pressed
// (Motion 5). With reduced motion neither moves.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`a coupon's cell settles while it is pressed and a tear-off tab leans under the pointer and pressed, with nothing snapping, ${reducedMotion === 'reduce' ? 'and with reduced motion neither moves' : 'without reduced motion'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto(addressIn(english, vendorPage(everyDetail)), {
      waitUntil: 'networkidle',
    });
    const cell = await contactLink(page, 'call').boundingBox();
    if (cell === null) throw new Error('The call is not on the page.');

    const pressed = await film(
      page,
      lookAtTheVendorPage,
      async () => {
        await page.mouse.move(cell.x + cell.width / 2, cell.y + cell.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(900);
        // Let go elsewhere, so that the press calls no one.
        await page.mouse.move(cell.x + cell.width / 2, cell.y - 300);
        await page.mouse.up();
      },
      { forMs: 1200 },
    );
    const scales = pressed.map(({ at, drawn }) => ({
      at,
      value: (drawn.cell ?? 1) * 1000,
    }));

    await tearOffTabs(page).scrollIntoViewIfNeeded();
    const tab = await tearOffTabs(page).getByRole('link').first().boundingBox();
    if (tab === null) throw new Error('No tear-off tab on the page.');
    const leaning = await film(
      page,
      lookAtTheVendorPage,
      async () => {
        await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
        await page.waitForTimeout(900);
        await page.mouse.down();
        await page.waitForTimeout(900);
        await page.mouse.move(tab.x + tab.width / 2, tab.y - 300);
        await page.mouse.up();
      },
      { forMs: 1200 },
    );
    const turns = leaning.map(({ at, drawn }) => ({
      at,
      value: (drawn.tab?.turn ?? 0) * 100,
    }));
    const drops = leaning.map(({ at, drawn }) => ({
      at,
      value: (drawn.tab?.drop ?? 0) * 10,
    }));

    if (reducedMotion === 'reduce') {
      for (const { value } of scales) expect(value).toBe(1000);
      for (const { value } of turns) expect(value).toBe(0);
      for (const { value } of drops) expect(value).toBe(0);
      return;
    }
    expect(
      Math.min(...scales.map(({ value }) => value)),
      'the cell settles to 0.97',
    ).toBeCloseTo(970, 0);
    expect(scales.at(-1)?.value, 'the cell comes back').toBe(1000);
    expect(
      Math.max(...turns.map(({ value }) => value)),
      'the tab leans 5 degrees pressed',
    ).toBeCloseTo(500, 0);
    expect(
      turns.some(({ value }) => Math.abs(value - 200) < 1),
      'the tab leans 2 degrees under the pointer',
    ).toBe(true);
    expect(
      Math.max(...drops.map(({ value }) => value)),
      'the tab drops 6 pixels pressed',
    ).toBeCloseTo(60, 0);
    expect(turns.at(-1)?.value, 'the tab comes back').toBe(0);
    expect([
      ...snapsOf("the cell's size", scales),
      ...snapsOf("the tab's turn", turns),
      ...snapsOf("the tab's drop", drops),
    ]).toEqual([]);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('in Kurdish and English, the Vendor page is the finished page: the sheet of Offers printed and its prices settled from the first frame', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        const frames = await filmFromTheFirstFrame(
          page,
          lookAtTheVendorPage,
          async () => {
            await page.goto(addressIn(language, vendorPage(everyDetail)), {
              waitUntil: 'networkidle',
            });
            await bringTheSheetIntoView(page);
          },
          { forMs: 3000 },
        );
        await expectMotionAllowed(page, false);
        expect(
          frames.filter(({ drawn }) => drawn.sheet !== null).length,
          'the sheet was filmed',
        ).toBeGreaterThan(5);
        for (const { drawn } of frames) {
          if (drawn.sheet !== null)
            expect(drawn.sheet.covered, 'the sheet is whole').toBe(0);
          if (drawn.price !== null) expect(drawn.price.opacity).toBe(1);
        }
      });
    }
  });
});

test.describe('without script', () => {
  test.use({ javaScriptEnabled: false });

  test('in Kurdish and English, nothing on the Vendor page moves, and it arrives whole, as the server sent it, its paging links working', async ({
    page,
  }) => {
    for (const language of kurdishAndEnglish) {
      await test.step(`in ${language.name}`, async () => {
        await page.goto(addressIn(language, vendorPage(everyDetail)));
        expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(
          true,
        );
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
        const drawn = await page.evaluate(lookAtTheVendorPage);
        expect(drawn.sheet?.covered).toBe(0);
        expect(drawn.price?.opacity).toBe(1);

        await page.goto(addressIn(language, vendorPage(paged)));
        await page.getByRole('link').and(page.locator('[rel="next"]')).click();
        await expect(page).toHaveURL(
          `${addressIn(language, vendorPage(paged))}?page=2#offers`,
        );
        await expect(vendorsOffers(page)).toHaveCount(1);
      });
    }
  });
});
