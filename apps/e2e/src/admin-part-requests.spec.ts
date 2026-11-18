import {
  type APIRequestContext,
  expect,
  type Page,
  type Route,
  test,
} from '@playwright/test';

import { expectAccessible } from './accessibility';
import {
  findOnTheQueue,
  fulfilByTheApi,
  type MadeUpPartRequest,
  partRequestsHeading,
  partRequestsUrl,
  partRequestUrl,
  placeOnTheQueue,
  queuedRequests,
  rejectByTheApi,
  sendAMadeUpPartRequest,
  thePartRequestsSection,
  theVendorsPartRequests,
} from './admin-part-requests';
import { vendorPageUrl } from './admin-vendors';
import { catalogHeading, createAMadeUpPart } from './catalog';
import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { addressIn, expectNoSidewaysScroll, languages, narrowWindow } from './languages';
import { type DrawnFrame, filmTheList, jumpsIn } from './leaving-rows';
import { theMenuSheet } from './menu-sheet';
import { snapsOf } from './motion-film';
import { addAnOffer } from './offers';
import { offerOf, switchTheVendor } from './part-page';
import { apiUrl } from './platform';
import { createAMadeUpVendor, type MadeUpVendor } from './vendors';

// The Admin works the queue of open Part Requests from a phone, in a
// Vendor's shop (REQ-2, REQ-3, LANG-8). Each test sends its own made-up
// requests for its own made-up Vendor through the API, and finds them on the
// queue from its last page back, since earlier runs leave theirs.
test.use({ viewport: narrowWindow });

let authorization: string;
let vendor: MadeUpVendor;
let partRequest: MadeUpPartRequest;

test.beforeEach(async ({ page, request }) => {
  authorization = await authorizationOfTheDevelopmentAdmin(page);
  await expect(catalogHeading(page)).toBeVisible();
  vendor = await createAMadeUpVendor(request, authorization);
  partRequest = await sendAMadeUpPartRequest(request, authorization, vendor.id);
});

// The queue's answer, as the API gives one page of it.
function aPageOf(content: unknown[]) {
  return {
    content,
    pageNumber: 0,
    pageSize: 20,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
    first: true,
    last: true,
  };
}

// Answers the page's every call for the queue, and for its count, with the
// answer given.
async function answerTheQueue(
  page: Page,
  answer: (route: Route) => Promise<void>,
): Promise<void> {
  await page.route(`${apiUrl}/v1/part-requests?**`, answer);
}

// The queue's address, on whichever page of it the request was found.
const theQueuesAddress = new RegExp(`^${partRequestsUrl}(\\?page=\\d+)?$`);

// The request's screen, told apart by its title, the request's name as the
// Vendor wrote it.
function theRequestsTitle(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name });
}

test.describe('the section', () => {
  test('the menu sheet lists Part Requests last, the seventh section, with the count of open requests, and leads to the queue', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Sections' }).click();
    const links = theMenuSheet(page)
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link');
    await expect(links).toHaveText([
      'Catalog',
      'Vendors',
      'Missing specifications',
      'Expiring Offers',
      'Platform Rate',
      'Referrals',
      /^Part Requests [\d,]+ open$/,
    ]);
    // The count is the queue's, in Note Grey and never on a plate, at least
    // the request this test sent.
    const count = thePartRequestsSection(page).getByTestId('open-count');
    await expect(count).toHaveText(/^ ?[\d,]+ open$/);
    expect(Number((await count.innerText()).replace(/\D/g, ''))).toBeGreaterThanOrEqual(1);

    await thePartRequestsSection(page).click();
    await expect(partRequestsHeading(page)).toBeVisible();
    await expect(page).toHaveURL(partRequestsUrl);
  });

  test.describe('at a desk’s width', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('the sidebar lists Part Requests last, with its package and plus, and marks it as the section the Admin is in', async ({
      page,
    }) => {
      await expect(
        page.getByRole('navigation', { name: 'Sections' }).getByRole('link'),
      ).toHaveText([
        'Catalog',
        'Vendors',
        'Missing specifications',
        'Expiring Offers',
        'Platform Rate',
        'Referrals',
        /^Part Requests [\d,]+ open$/,
      ]);
      await expect(
        thePartRequestsSection(page).locator('svg.lucide-package-plus'),
      ).toHaveCount(1);
      await thePartRequestsSection(page).click();
      await expect(partRequestsHeading(page)).toBeVisible();
      await expect(thePartRequestsSection(page)).toHaveAttribute('aria-current', 'page');
    });
  });
});

test.describe('the queue', () => {
  test('holds the made-up request, naming its Vendor as written with a link of its own, its Category, name, part number and days waiting, and its row leads to the request', async ({
    page,
    request,
  }) => {
    const row = await findOnTheQueue(page, request, authorization, partRequest);

    await expect(row).toContainText(partRequest.name);
    await expect(row).toContainText('PSU');
    await expect(row).toContainText(partRequest.partNumber);
    await expect(row).toContainText('Waiting since today');
    // The count of open requests, in words, on the end side.
    await expect(page.getByTestId('part-requests-count')).toHaveText(/^[\d,]+$/);
    await expect(page.locator('[data-slot="plate"]')).toHaveCount(0);
    await expectNoSidewaysScroll(page);

    // The Vendor's name is a link of its own, as high as a control, and not
    // the row's.
    const vendorLink = row.getByRole('link', { name: vendor.name, exact: true });
    await expect(vendorLink).toHaveAttribute('href', `/vendors/${vendor.id}`);
    expect((await vendorLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);

    // The request's address keeps the queue's page, for the way back.
    await row.getByRole('link', { name: partRequest.name }).click();
    await expect(page).toHaveURL(
      new RegExp(`^${partRequestUrl(partRequest.id)}(\\?page=\\d+)?$`),
    );
    await expect(theRequestsTitle(page, partRequest.name)).toBeVisible();
  });

  test('with rows, meets the automated part of WCAG 2.2 level AA, in light and in dark', async ({
    page,
    request,
  }) => {
    await findOnTheQueue(page, request, authorization, partRequest);
    await expectAccessible(page);
  });

  test('marks a Deactivated Vendor’s request', async ({ page, request }) => {
    await switchTheVendor(request, authorization, vendor.id, 'deactivate');

    const row = await findOnTheQueue(page, request, authorization, partRequest);

    await expect(row.getByText('Deactivated', { exact: true })).toBeVisible();
  });

  test('with none, says that no Part Request is waiting, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    await answerTheQueue(page, (route) => route.fulfill({ json: aPageOf([]) }));
    await page.goto(partRequestsUrl);

    await expect(page.getByTestId('nothing-waiting')).toContainText(
      'No Part Request is waiting',
    );
    await expect(queuedRequests(page)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test('a refusal and an API that cannot be reached each say that the Part Requests could not be listed, and why', async ({
    page,
  }) => {
    await answerTheQueue(page, (route) =>
      route.fulfill({
        status: 403,
        json: { errors: [{ code: 'ACCESS_DENIED', title: 't', detail: 'd' }] },
      }),
    );
    await page.goto(partRequestsUrl);
    await expect(page.getByTestId('refusal')).toContainText(
      'The Part Requests could not be listed.',
    );
    await expect(page.getByTestId('refusal')).toContainText(
      'The API refused, with 403, ACCESS_DENIED.',
    );

    await page.unrouteAll();
    await answerTheQueue(page, (route) => route.abort());
    await page.goto(partRequestsUrl);
    await expect(page.getByTestId('refusal')).toContainText(
      'The Part Requests could not be listed.',
    );
    await expect(page.getByTestId('refusal')).toContainText('The API cannot be reached.');
  });

  test.describe('at a desk’s width', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('the queue is a table of the Part, its Vendor and how long it has waited, and the Vendor’s link leads to its page', async ({
      page,
      request,
    }) => {
      const row = await findOnTheQueue(page, request, authorization, partRequest);

      const table = page.getByRole('table', { name: 'Open Part Requests' });
      await expect(table.getByRole('columnheader')).toHaveText([
        'Part',
        'Vendor',
        'Waiting',
      ]);
      await expect(row.getByRole('cell').nth(2)).toHaveText('Sent today');
      await expect(row.getByRole('cell').nth(2)).toHaveCSS('text-align', 'end');
      await expectNoSidewaysScroll(page);
      await expectAccessible(page);

      await row.getByRole('link', { name: vendor.name, exact: true }).click();
      await expect(page).toHaveURL(vendorPageUrl(vendor.id));
    });
  });
});

test.describe('one request', () => {
  test('shows everything the Vendor sent, its prices on a plate, and its three ways; it meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    await page.goto(partRequestUrl(partRequest.id));

    await expect(theRequestsTitle(page, partRequest.name)).toBeVisible();
    const details = page.getByTestId('request-details');
    await expect(details).toContainText(vendor.name);
    await expect(details).toContainText('Today');
    await expect(details).toContainText('PSU, as the Vendor gave it');
    await expect(details).toContainText(partRequest.partNumber);
    await expect(details.locator('[data-slot="plate"]')).toHaveCount(1);
    await expect(details.getByTestId('usd-price')).toHaveText('79 $');
    await expect(details.getByTestId('iqd-price')).toHaveText('125,000 IQD');
    await expect(details).toContainText('In stock');
    await expect(details).toContainText('36 months');
    // Its Offer would not be expired: no warning.
    await expect(page.getByTestId('offer-would-be-expired')).toHaveCount(0);

    // Its three ways, in the order the Admin works.
    await expect(
      page.getByRole('heading', { level: 2 }).filter({ hasText: /^(Match|Create|Reject)/ }),
    ).toHaveText(['Match it to a Part', 'Create the Part', 'Reject it']);
    await expect(page.getByRole('searchbox', { name: 'Search the catalog' })).toHaveValue(
      partRequest.partNumber,
    );
    await expect(page.getByRole('link', { name: 'Create the Part' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject…' })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test('sent more than 14 days ago, warns that its Offer will be listed as expired, and meets WCAG 2.2 level AA in light and in dark', async ({
    page,
  }) => {
    // No request can be made old through the API, so the page is given the
    // request as the API answers it 40 days after it was sent.
    await page.route(`${apiUrl}/v1/part-requests/${partRequest.id}`, async (route) => {
      const answered = await route.fetch();
      route.fulfill({
        response: answered,
        json: { ...(await answered.json()), daysSinceSent: 40, offerWouldBeExpired: true },
      });
    });
    await page.goto(partRequestUrl(partRequest.id));

    const warning = page.getByTestId('offer-would-be-expired');
    await expect(warning).toContainText('Its Offer will be listed as expired');
    await expect(warning).toContainText('It was sent 40 days ago');
    await expect(warning).toContainText(vendor.name);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  });

  test('a resolved request’s address shows how it was resolved and offers nothing', async ({
    page,
    request,
  }) => {
    const reason = 'ژمارەی پارچەکە هەڵەیە. The part number is not the maker’s.';
    await rejectByTheApi(request, authorization, partRequest.id, reason);

    await page.goto(partRequestUrl(partRequest.id));

    await expect(theRequestsTitle(page, partRequest.name)).toBeVisible();
    const resolved = page.getByTestId('how-it-was-resolved');
    await expect(resolved).toContainText('Rejected on ');
    await expect(resolved.getByTestId('reason')).toHaveText(reason);
    await expect(page.getByRole('searchbox', { name: 'Search the catalog' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('link', { name: 'Create the Part' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reject…' })).toHaveCount(0);
    await expectNoSidewaysScroll(page);

    // A fulfilled one names the Part it was fulfilled with, leading to it.
    const fulfilled = await sendAMadeUpPartRequest(request, authorization, vendor.id);
    const part = await createAMadeUpPart(request, authorization, {}, 'psu');
    await fulfilByTheApi(request, authorization, fulfilled.id, part.id);
    await page.goto(partRequestUrl(fulfilled.id));
    const how = page.getByTestId('how-it-was-resolved');
    await expect(how).toContainText('Fulfilled on ');
    await expect(how.getByRole('link', { name: part.name })).toHaveAttribute(
      'href',
      `/catalog/parts/${part.id}`,
    );
    await expect(page.getByRole('button', { name: 'Reject…' })).toHaveCount(0);
  });
});

test.describe('rejecting', () => {
  test('a reason is asked for in the dialog, which says a missing one beside its field; given, the request leaves the queue, and the Vendor’s list holds the reason as written', async ({
    page,
    request,
  }) => {
    const row = await findOnTheQueue(page, request, authorization, partRequest);
    await row.getByRole('link', { name: partRequest.name }).click();
    await expect(theRequestsTitle(page, partRequest.name)).toBeVisible();

    await page.getByRole('button', { name: 'Reject…' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Reject this Part Request?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(partRequest.name);
    const reason = dialog.getByRole('textbox', { name: 'Reason' });
    await expect(reason, 'the focus is in the reason’s field').toBeFocused();

    // No reason: said beside the field, and the dialog stays open.
    await dialog.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(dialog).toContainText(
      'Give a reason: the Vendor is told why its Part was not added.',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expectAccessible(page);

    const written = 'ئەم ژمارەیە هی هیچ دابینکەرێکی وزە نییە.\nCheck the label on the box.';
    await reason.fill(written);
    await dialog.getByRole('button', { name: 'Reject', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(theQueuesAddress);
    await expect(partRequestsHeading(page)).toBeVisible();
    const note = page.getByTestId('resolution-note');
    await expect(note).toContainText('Request rejected');
    await expect(note).toContainText(partRequest.name);
    await expect(note).toContainText(`${vendor.name} reads your reason in its portal.`);
    await expect(queuedRequests(page).filter({ hasText: partRequest.name })).toHaveCount(0);
    expect(await placeOnTheQueue(request, authorization, partRequest.id)).toBeUndefined();

    const [listed] = await theVendorsPartRequests(request, authorization, vendor.id);
    expect(listed.id).toBe(partRequest.id);
    expect(listed.state).toBe('rejected');
    expect(listed.reason).toBe(written);
  });

  test('a request resolved meanwhile, as from another tab, is shown as resolved once the rejection is refused', async ({
    page,
    request,
  }) => {
    await page.goto(partRequestUrl(partRequest.id));
    await expect(theRequestsTitle(page, partRequest.name)).toBeVisible();
    await rejectByTheApi(
      request,
      authorization,
      partRequest.id,
      'Rejected from another tab.',
    );

    await page.getByRole('button', { name: 'Reject…' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Reject this Part Request?' });
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('A second reason.');
    await dialog.getByRole('button', { name: 'Reject', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    const resolved = page.getByTestId('how-it-was-resolved');
    await expect(resolved).toContainText('Rejected on ');
    await expect(resolved.getByTestId('reason')).toHaveText('Rejected from another tab.');
    await expect(page.getByRole('button', { name: 'Reject…' })).toHaveCount(0);
  });
});

// The Vendor's Offers for the Parts whose name, manufacturer or part number
// holds the words, as the API lists them to the Admin.
async function theVendorsOffersFor(
  request: APIRequestContext,
  vendorId: string,
  words: string,
): Promise<
  {
    part: { id: string };
    usdPrice: string | null;
    iqdPrice: number | null;
    inStock: boolean;
    warrantyMonths: number | null;
  }[]
> {
  const answered = await request.get(`${apiUrl}/v1/vendors/${vendorId}/offers`, {
    headers: { authorization },
    params: { search: words },
  });
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { content: [] }).content;
}

// How many Parts of the catalog hold the words in their name, manufacturer or
// part number, as the API counts them.
async function partsFound(request: APIRequestContext, words: string): Promise<number> {
  const answered = await request.get(`${apiUrl}/v1/parts`, {
    headers: { authorization },
    params: { search: words, size: 1 },
  });
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { totalElements: number }).totalElements;
}

// Opens the request from its row on the queue, as the Admin does.
async function openFromTheQueue(
  page: Page,
  request: APIRequestContext,
  sent: MadeUpPartRequest,
): Promise<void> {
  const row = await findOnTheQueue(page, request, authorization, sent);
  await row.getByRole('link', { name: sent.name }).click();
  await expect(theRequestsTitle(page, sent.name)).toBeVisible();
}

// A Part's page under the Catalog, which creating the Part leads to.
const aPartsPage = /\/catalog\/parts\/[0-9a-f-]{36}$/;

test.describe('matching', () => {
  test('the search starts with the part number and shows a Part the Vendor already offers; matching another, after one question, makes the Vendor’s Offer for it with the request’s details', async ({
    page,
    request,
  }) => {
    const offered = await createAMadeUpPart(request, authorization, {}, 'psu', {
      partNumber: partRequest.partNumber,
    });
    const other = await createAMadeUpPart(request, authorization, {}, 'gpu', {
      partNumber: `${partRequest.partNumber}-B`,
    });
    await addAnOffer(request, authorization, vendor.id, offered.id, { usdPrice: '99.00' });
    await openFromTheQueue(page, request, partRequest);

    const found = page.getByRole('list', { name: 'Parts to match' }).getByRole('listitem');
    await expect(found).toHaveCount(2);
    await expect(page.getByTestId('matches-count')).toHaveText('2');
    const offeredRow = found.filter({ hasText: offered.name });
    const otherRow = found.filter({ hasText: other.name });
    await expect(offeredRow.getByTestId('offered')).toHaveText(
      `${vendor.name} offers this Part`,
    );
    await expect(otherRow.getByTestId('offered')).toHaveCount(0);
    // A Part of another Category than the request's can match it.
    await expect(otherRow).toContainText('GPU');
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    await otherRow.getByRole('button', { name: /^Match/ }).click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Match this request to the Part?',
    });
    await expect(dialog).toContainText(other.name);
    await expect(dialog).toContainText(`${vendor.name} has no Offer for this Part.`);
    await expect(dialog).toContainText(
      'The request is fulfilled either way, and leaves the queue.',
    );
    await dialog.getByRole('button', { name: 'Match', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(theQueuesAddress);
    const note = page.getByTestId('resolution-note');
    await expect(note).toContainText('Request fulfilled');
    await expect(note).toContainText(
      `${partRequest.name} is matched to ${other.name}, and ${vendor.name}’s Offer for it was made with the request’s details.`,
    );
    await expect(queuedRequests(page).filter({ hasText: partRequest.name })).toHaveCount(0);
    expect(await placeOnTheQueue(request, authorization, partRequest.id)).toBeUndefined();

    const offers = await theVendorsOffersFor(request, vendor.id, other.word);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      part: { id: other.id },
      usdPrice: '79.00',
      iqdPrice: 125_000,
      inStock: true,
      warrantyMonths: 36,
    });
  });

  test('a Part the Vendor already offers is matched after a question that says the newer statement wins, and its Offer, confirmed after the request was sent, is kept', async ({
    page,
    request,
  }) => {
    const offered = await createAMadeUpPart(request, authorization, {}, 'psu', {
      partNumber: partRequest.partNumber,
    });
    // Confirmed after the request was sent, so the Vendor's own statement is
    // the newer, and the Offer is kept.
    await addAnOffer(request, authorization, vendor.id, offered.id, { usdPrice: '99.00' });
    await page.goto(partRequestUrl(partRequest.id));

    const row = page
      .getByRole('list', { name: 'Parts to match' })
      .getByRole('listitem')
      .filter({ hasText: offered.name });
    await row.getByRole('button', { name: /^Match/ }).click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Match this request to the Part?',
    });
    await expect(dialog).toContainText(`${vendor.name} already offers this Part.`);
    await dialog.getByRole('button', { name: 'Match', exact: true }).click();

    await expect(page.getByTestId('resolution-note')).toContainText(
      `${vendor.name}’s Offer for it was kept as it was: the Vendor confirmed it after sending the request.`,
    );
    const [kept] = await theVendorsOffersFor(request, vendor.id, offered.word);
    expect(kept.usdPrice).toBe('99.00');
  });
});

test.describe('creating', () => {
  test('the form for a new Part comes filled from the request, its Category changeable; creating it fulfils the request and leads to its page with a note, and the Shopper sees the Vendor’s Offer at the request’s price', async ({
    page,
    request,
  }) => {
    await openFromTheQueue(page, request, partRequest);
    await page.getByRole('link', { name: 'Create the Part' }).click();

    await expect(page).toHaveURL(
      new RegExp(`/part-requests/${partRequest.id}/new-part(\\?.*)?$`),
    );
    await expect(page.getByRole('heading', { level: 1, name: 'New Part' })).toBeVisible();
    await expect(page.getByTestId('from-the-request')).toContainText(partRequest.name);
    const category = page.getByRole('combobox', { name: 'Category' });
    const name = page.getByRole('textbox', { name: 'Name', exact: true });
    const manufacturer = page.getByRole('textbox', { name: 'Manufacturer', exact: true });
    const partNumber = page.getByRole('textbox', { name: 'Part number 1', exact: true });
    await expect(category).toHaveValue('psu');
    await expect(name).toHaveValue(partRequest.name);
    await expect(partNumber).toHaveValue(partRequest.partNumber);
    await expect(manufacturer).toHaveValue('');
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);

    // Another Category draws its specifications and keeps what was typed.
    await manufacturer.fill('Made-up Test Parts');
    await category.selectOption('cpu');
    await expect(page.getByRole('textbox', { name: 'Series', exact: true })).toBeVisible();
    await expect(name).toHaveValue(partRequest.name);
    await expect(manufacturer).toHaveValue('Made-up Test Parts');
    await expect(partNumber).toHaveValue(partRequest.partNumber);
    await category.selectOption('psu');
    await expect(page.getByRole('textbox', { name: 'Series', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Create the Part' }).click();

    await expect(page).toHaveURL(aPartsPage);
    const partId = page.url().split('/').pop() ?? '';
    await expect(
      page.getByRole('heading', { level: 1, name: partRequest.name }),
    ).toBeVisible();
    const note = page.getByTestId('created-from-a-request');
    await expect(note).toContainText('Part created and request fulfilled');
    await expect(note).toContainText(
      `${vendor.name}’s Offer for it was made with the request’s details.`,
    );
    await expect(page.getByText('Add a photo', { exact: true })).toBeVisible();
    expect(await placeOnTheQueue(request, authorization, partRequest.id)).toBeUndefined();

    // Success criterion 10: the Shopper's page of the Part lists the
    // Vendor's Offer at the request's price.
    await page.goto(addressIn(languages[2], `/parts/${partId}`));
    await expect(offerOf(page, vendor.id).getByTestId('shown-price')).toHaveText(
      '125,000 IQD',
    );
  });

  test('the halfway case: with the fulfilment not answered, the screen says the Part was created and the request is still open; fulfilling it with that Part succeeds, and the catalog holds one such Part', async ({
    page,
    request,
  }) => {
    await page.route(
      `${apiUrl}/v1/part-requests/${partRequest.id}/fulfil`,
      (route) => route.abort(),
      { times: 1 },
    );
    await page.goto(`${partRequestUrl(partRequest.id)}/new-part`);
    await page
      .getByRole('textbox', { name: 'Manufacturer', exact: true })
      .fill('Made-up Test Parts');
    await page.getByRole('button', { name: 'Create the Part' }).click();

    const halfway = page.getByTestId('halfway');
    await expect(halfway).toContainText(
      'The Part was created, but the request is still open',
    );
    await expect(halfway).toContainText(
      'Fulfilling the request with it was not answered: the API could not be reached.',
    );
    // The form takes no more input, and has no button: the Part is never
    // created twice.
    await expect(page.getByRole('button', { name: 'Create the Part' })).toHaveCount(0);
    const fulfil = halfway.getByRole('button', { name: 'Fulfil it with this Part' });
    await expect(fulfil).toBeFocused();
    await expectNoSidewaysScroll(page);

    await fulfil.click();
    await expect(page).toHaveURL(aPartsPage);
    await expect(page.getByTestId('created-from-a-request')).toContainText(
      'Part created and request fulfilled',
    );
    expect(await partsFound(request, partRequest.word)).toBe(1);
    expect(await placeOnTheQueue(request, authorization, partRequest.id)).toBeUndefined();
  });
});

// The request as the API answers it to the Admin, for an answer of the
// queue the test gives.
async function theRequestAsAnswered(
  request: APIRequestContext,
  id: string,
): Promise<Record<string, unknown>> {
  const answered = await request.get(`${apiUrl}/v1/part-requests/${id}`, {
    headers: { authorization },
  });
  expect(answered.status()).toBe(200);
  return (await answered.json()) as Record<string, unknown>;
}

// What a film of the queue sees of one row in each frame: where its top is,
// or null while it is not drawn.
function topsOf(
  frames: DrawnFrame[],
  name: string,
): { at: number; value: number | null }[] {
  return frames.map(({ at, rows }) => ({
    at,
    value: rows.find((row) => row.key.startsWith(name))?.top ?? null,
  }));
}

// The same, for how high the row is drawn.
function heightsOf(
  frames: DrawnFrame[],
  name: string,
): { at: number; value: number | null }[] {
  return frames.map(({ at, rows }) => ({
    at,
    value: rows.find((row) => row.key.startsWith(name))?.height ?? null,
  }));
}

// The motion of a resolution (Motion 12): the made-up request, second of four
// on a page of the queue, is rejected from its screen, and the queue it
// returns to is answered without it and with the next page's first, so that
// it leaves, the rows below rise into its place and the next arrives at the
// end, watched four times slower, frame by frame. The queue's answers are the
// test's own, so that the rows around it are known; the request, its screen
// and its rejection are real.
async function filmARejection(
  page: Page,
  request: APIRequestContext,
  { delayed }: { delayed: number },
): Promise<DrawnFrame[]> {
  const real = await theRequestAsAnswered(request, partRequest.id);
  const [first, third, fourth, fifth] = ['First', 'Third', 'Fourth', 'Fifth'].map(
    (word, index) => ({
      ...real,
      id: `00000000-0000-4000-8000-00000060000${index}`,
      name: `Made-up ${word} request`,
    }),
  );
  const ofThree = (content: unknown[]) => ({
    ...aPageOf(content),
    totalElements: 47,
    totalPages: 3,
    last: false,
  });
  await answerTheQueue(page, (route) =>
    route.fulfill({ json: ofThree([first, real, third, fourth]) }),
  );
  await page.goto(partRequestsUrl);
  await expect(queuedRequests(page)).toHaveCount(4);
  await queuedRequests(page).nth(1).getByRole('link', { name: partRequest.name }).click();
  await expect(page.getByRole('button', { name: 'Reject…' })).toBeVisible();
  await page.getByRole('button', { name: 'Reject…' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Reject this Part Request?' });
  await dialog.getByRole('textbox', { name: 'Reason' }).fill('Filmed leaving the queue.');

  await page.unrouteAll();
  await answerTheQueue(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayed));
    await route.fulfill({ json: ofThree([first, third, fourth, fifth]) });
  });
  const frames = await filmTheList(
    page,
    'Open Part Requests',
    () => dialog.getByRole('button', { name: 'Reject', exact: true }).click(),
    { slowedBy: 4, forMs: 4000 },
  );

  await expect(page.getByTestId('resolution-note')).toContainText('Request rejected');
  await expect(queuedRequests(page)).toHaveCount(4);
  await expect(queuedRequests(page).nth(1)).toContainText('Made-up Third request');
  await expect(queuedRequests(page).nth(3)).toContainText('Made-up Fifth request');
  return frames;
}

// The film judged: no row appears, or is taken out while it can be seen or
// takes room, and none fades in one frame; the row below the one leaving
// rises into its place, the leaving row's space closes and the arriving
// one's opens over the frames, none of them in one, by `snapsOf`, which
// judges each step against its own movement, as the offers' films do, since
// the out curve's first frame of a 100-pixel space is larger than a fixed
// step; and the leaving was seen, over more than `atLeast` milliseconds of
// the film's slowed clock.
function expectNoJumpIn(frames: DrawnFrame[], atLeast: number): void {
  expect(jumpsIn(frames, { step: Infinity, fade: 0.35 })).toEqual([]);
  expect([
    ...snapsOf('the row below', topsOf(frames, 'Made-up Third')),
    ...snapsOf('the leaving row’s height', heightsOf(frames, 'Made-up requested')),
    ...snapsOf('the arriving row’s height', heightsOf(frames, 'Made-up Fifth')),
  ]).toEqual([]);
  const leaving = (frame: DrawnFrame) =>
    frame.rows.find((row) => row.key.startsWith('Made-up requested'));
  const fading = frames.findIndex((frame) => (leaving(frame)?.opacity ?? 1) < 1);
  const gone = frames.findIndex((frame, index) => index > fading && !leaving(frame));
  expect(fading, 'the resolved row was seen fading').toBeGreaterThan(-1);
  expect(gone, 'the resolved row was taken out').toBeGreaterThan(fading);
  expect(frames[gone].at - frames[fading].at).toBeGreaterThan(atLeast);
}

test.describe('motion', () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`on a phone, the rejected request leaves the queue it returns to, the rows below rising into its place and the next arriving, and nothing jumps in a frame, watched four times slower, ${reducedMotion} motion`, async ({
      page,
      request,
    }) => {
      await page.emulateMedia({ reducedMotion });
      const frames = await filmARejection(page, request, { delayed: 0 });

      // From the first frame the queue is drawn in, as the screen changes.
      const drawn = frames.findIndex((frame) => frame.rows.length > 0);
      expect(drawn).toBeGreaterThan(-1);
      expectNoJumpIn(frames.slice(drawn), 900);
    });
  }

  test.describe('at a desk’s width', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      test(`the pane closes at once, then the rejected request leaves the table as the note opens its space above it, and nothing jumps in a frame, watched four times slower, ${reducedMotion} motion`, async ({
        page,
        request,
      }) => {
        await page.emulateMedia({ reducedMotion });
        // The queue's next answer comes a moment after the pane has closed,
        // which it does at once, so that the film judges the leaving apart
        // from the change of screen.
        const frames = await filmARejection(page, request, { delayed: 600 });

        // From the frame the queue is a table again, once the pane closed.
        const table = frames.findIndex((frame) => frame.headings.length > 0);
        expect(table).toBeGreaterThan(-1);
        expectNoJumpIn(frames.slice(table), 900);
      });
    }
  });
});
