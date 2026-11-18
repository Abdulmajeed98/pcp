import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { aWordUniqueToTheRun } from './made-up';
import { apiUrl, dashboardUrl } from './platform';

// The Admin console's Part Requests, the queue of open Part Requests, and
// one request's screen under it. The Admin console is in English only, so
// its screens are found by their English names.
export const partRequestsUrl = `${dashboardUrl}/part-requests`;

export function partRequestUrl(id: string): string {
  return `${partRequestsUrl}/${id}`;
}

// The queue's heading, which tells the screen apart.
export function partRequestsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Part Requests' });
}

// What a test gives a Part Request it sends, as the API takes it. A price
// given as null is left out, so that it is not quoted.
export interface PartRequestDetails {
  category?: string;
  name?: string;
  partNumber?: string;
  usdPrice?: string | null;
  iqdPrice?: number | null;
  inStock?: boolean;
  warrantyMonths?: number | null;
}

// A made-up Part Request a test sends, with what it was sent with.
export interface MadeUpPartRequest {
  id: string;
  vendorId: string;
  // A word no other request has, which its name and its part number hold
  // unless the test gave its own.
  word: string;
  category: string;
  name: string;
  partNumber: string;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
}

// Sends a made-up Part Request for a made-up Vendor over HTTP, as the Admin
// acting for the Vendor, as the Vendor's portal sends one: a PSU, plainly
// test data, with a name and a part number unique to the run, quoted in
// both currencies, in stock, with a warranty, unless the test says
// otherwise. It stays in the development database, open until a test
// resolves it, and `pnpm services:reset` empties it.
export async function sendAMadeUpPartRequest(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  details: PartRequestDetails = {},
): Promise<MadeUpPartRequest> {
  const word = aWordUniqueToTheRun();
  const sent = {
    category: 'psu',
    name: `Made-up requested Part ${word}`,
    partNumber: `REQ-${word}`,
    usdPrice: '79.00' as string | null,
    iqdPrice: 125_000 as number | null,
    inStock: true,
    warrantyMonths: 36 as number | null,
    ...details,
  };
  const answered = await request.post(`${apiUrl}/v1/vendors/${vendorId}/part-requests`, {
    headers: { authorization },
    data: Object.fromEntries(Object.entries(sent).filter(([, value]) => value !== null)),
  });
  expect(answered.status()).toBe(201);
  const { id } = (await answered.json()) as { id: string };

  return { id, vendorId, word, ...sent };
}

// Rejects a Part Request over HTTP as the Admin, with a reason.
export async function rejectByTheApi(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
  reason: string,
): Promise<void> {
  const answered = await request.post(
    `${apiUrl}/v1/part-requests/${partRequestId}/reject`,
    {
      headers: { authorization },
      data: { reason },
    },
  );
  expect(answered.status()).toBe(200);
}

// Fulfils a Part Request with a Part over HTTP as the Admin.
export async function fulfilByTheApi(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
  partId: string,
): Promise<void> {
  const answered = await request.post(
    `${apiUrl}/v1/part-requests/${partRequestId}/fulfil`,
    {
      headers: { authorization },
      data: { partId },
    },
  );
  expect(answered.status()).toBe(200);
}

// One Part Request as the API answers it to the Admin, as far as the tests
// read it.
export interface AnsweredPartRequest {
  id: string;
  state: 'open' | 'fulfilled' | 'rejected';
  reason?: string;
  sentOn: string;
  daysSinceSent: number;
  part?: { id: string; name: string };
  offerId?: string | null;
}

// A Vendor's own Part Requests, as its list answers them to the Admin, the
// newest first: what the Vendor's portal shows it.
export async function theVendorsPartRequests(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
): Promise<AnsweredPartRequest[]> {
  const answered = await request.get(`${apiUrl}/v1/vendors/${vendorId}/part-requests`, {
    headers: { authorization },
    params: { size: 100 },
  });
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { content: AnsweredPartRequest[] }).content;
}

// How many Part Requests a page of the queue holds, and the most the API
// gives in one answer.
const requestsOnAPage = 20;
const requestsInAnAnswer = 100;

// The request's place on the queue, counted from 0, in the API's order, or
// none when the queue does not hold it. The queue is oldest first, so a
// request a test has just sent is among the last, whatever earlier runs
// left: the API is asked for its pages from the last back, and answers in
// one or two.
export async function placeOnTheQueue(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
): Promise<number | undefined> {
  const pageOf = async (number: number) => {
    const answered = await request.get(`${apiUrl}/v1/part-requests`, {
      headers: { authorization },
      params: { page: number, size: requestsInAnAnswer },
    });
    expect(answered.status()).toBe(200);
    return (await answered.json()) as { content: { id: string }[]; totalPages: number };
  };

  const { totalPages } = await pageOf(0);
  for (let number = totalPages - 1; number >= 0; number--) {
    const place = (await pageOf(number)).content.findIndex(
      (each) => each.id === partRequestId,
    );
    if (place >= 0) return number * requestsInAnAnswer + place;
  }
  return undefined;
}

// The requests on the queue: two-line rows on a phone, and a table's rows
// from 64rem.
export function queuedRequests(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Open Part Requests' })
    .getByRole('listitem')
    .or(
      page
        .getByRole('table', { name: 'Open Part Requests' })
        .getByRole('row')
        .filter({ has: page.getByRole('cell') }),
    );
}

// Opens the queue at the page that holds the request, by the page in the
// queue's address, and gives back its row.
export async function findOnTheQueue(
  page: Page,
  request: APIRequestContext,
  authorization: string,
  partRequest: MadeUpPartRequest,
): Promise<Locator> {
  const place = await placeOnTheQueue(request, authorization, partRequest.id);
  expect(place, 'the made-up request is on the queue').toBeDefined();
  const number = Math.floor((place as number) / requestsOnAPage) + 1;
  await page.goto(number === 1 ? partRequestsUrl : `${partRequestsUrl}?page=${number}`);
  await expect(partRequestsHeading(page)).toBeVisible();
  await expect(queuedRequests(page).first()).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const row = queuedRequests(page).filter({ hasText: partRequest.name });
  await expect(row, 'the made-up request is on its page of the queue').toHaveCount(1);
  return row;
}

// The section's link in the sidebar or the menu sheet, whose name is
// followed by the count of open requests when there are any.
export function thePartRequestsSection(page: Page): Locator {
  return page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: /^Part Requests( [\d,]+ open)?$/ });
}
