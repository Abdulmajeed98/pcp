import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { aWordUniqueToTheRun } from './made-up';
import { placeOnTheQueue, sendAPartRequest } from './part-requests';
import { dashboardUrl } from './platform';

// The Admin console's Part Requests, the queue of open Part Requests, and
// one request's screen under it. The Admin console is in English only, so
// its screens are found by their English names. What the tests send and
// read over HTTP is in `part-requests.ts`, beside the Vendor portal's.
export const partRequestsUrl = `${dashboardUrl}/part-requests`;

export function partRequestUrl(id: string): string {
  return `${partRequestsUrl}/${id}`;
}

// The queue's heading, which tells the screen apart.
export function partRequestsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Part Requests' });
}

// A made-up Part Request a test sends, with what it was sent with.
export interface MadeUpPartRequest {
  id: string;
  vendorId: string;
  // A word no other request has, which its name and its part number hold.
  word: string;
  category: string;
  name: string;
  partNumber: string;
}

// Sends a made-up Part Request for a made-up Vendor over HTTP, as the Admin
// acting for the Vendor, as the Vendor's portal sends one: a PSU, plainly
// test data, with a name and a part number unique to the run, at 79 dollars
// and 125,000 dinars, in stock, with 36 months of warranty. It stays in the
// development database, open until a test resolves it, and `pnpm
// services:reset` empties it.
export async function sendAMadeUpPartRequest(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
): Promise<MadeUpPartRequest> {
  const word = aWordUniqueToTheRun();
  const sent = {
    category: 'psu',
    name: `Made-up requested Part ${word}`,
    partNumber: `REQ-${word}`,
  };
  const { id } = await sendAPartRequest(request, authorization, vendorId, {
    ...sent,
    usdPrice: '79.00',
    iqdPrice: 125_000,
    inStock: true,
    warrantyMonths: 36,
  });
  return { id, vendorId, word, ...sent };
}

// How many Part Requests a page of the queue holds.
const requestsOnAPage = 20;

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
