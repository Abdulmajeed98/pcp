import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

import { apiUrl, dashboardUrl } from './platform';

// Referrals arranged over HTTP, as the Shopper's "send on WhatsApp" records
// them, so that a test of the counts needs no Shopper page (sharing ticket
// 03). Every call here is public, as a Shopper's are, and holds nothing
// about a Shopper.

// Shares a Build of the Parts given, by their identifiers, each once, and
// gives back its Shared Build's identifier: a new one, or the one an earlier
// share of the same Build stored.
export async function shareABuildOf(
  request: APIRequestContext,
  partIds: readonly string[],
): Promise<string> {
  const shared = await request.post(`${apiUrl}/v1/shared-builds`, {
    data: { part: partIds },
  });
  expect([200, 201]).toContain(shared.status());
  return ((await shared.json()) as { id: string }).id;
}

// Records one Referral of the Shared Build to the Vendor, which must be
// active and have given a WhatsApp number, as one tap on its button does.
export async function recordAReferral(
  request: APIRequestContext,
  sharedBuildId: string,
  vendorId: string,
): Promise<void> {
  const recorded = await request.post(
    `${apiUrl}/v1/shared-builds/${sharedBuildId}/referrals`,
    { data: { vendorId } },
  );
  expect(recorded.status()).toBe(201);
}

// A Vendor's Referral count, as the API answers it to the Admin.
export async function referralCountOf(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
): Promise<number> {
  const read = await request.get(`${apiUrl}/v1/vendors/${vendorId}/referral-count`, {
    headers: { authorization },
  });
  expect(read.status()).toBe(200);
  return ((await read.json()) as { count: number }).count;
}

// The Admin console's Referrals screen (sharing ticket 03), where a test
// finds its own made-up Vendors among those earlier runs left.
export const referralsUrl = `${dashboardUrl}/referrals`;

export function theReferralsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Referrals' });
}

// The Vendors on the list: rows on a phone, and a table's rows from 64rem.
export function vendorsListedOnTheReferrals(page: Page): Locator {
  return page
    .getByRole('list', { name: 'Referrals by Vendor' })
    .getByRole('listitem')
    .or(
      page
        .getByRole('table', { name: 'Referrals by Vendor' })
        .getByRole('row')
        .filter({ has: page.getByRole('cell') }),
    );
}

// How many Vendors a page of the dashboard's list holds, and the most the
// API gives in one answer.
const vendorsOnAPage = 20;
const vendorsInAnAnswer = 100;

// Where on the list a Vendor is looked for: from its first page for a
// Vendor with Referrals, which few Vendors have, and from its last for one
// with none. The list is by count, most first, then by name, and the word in
// a made-up Vendor's name begins with the time it was made, so a new made-up
// Vendor with no Referral is among the last of the many with none, and only
// Vendors named in another script follow it.
export type LookedForFrom = 'the first page' | 'the last page';

// The Vendor's place on the list, counted from 0, in the order the API gives
// it to the Admin, or none when the list does not hold it.
async function placeOnTheList(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  from: LookedForFrom,
): Promise<number | undefined> {
  const pageOf = async (number: number) => {
    const answered = await request.get(`${apiUrl}/v1/referral-counts`, {
      headers: { authorization },
      params: { page: number, size: vendorsInAnAnswer },
    });
    expect(answered.status()).toBe(200);
    return (await answered.json()) as { content: { id: string }[]; totalPages: number };
  };

  const first = await pageOf(0);
  const numbers = Array.from({ length: first.totalPages }, (_, number) => number);
  for (const number of from === 'the first page' ? numbers : numbers.reverse()) {
    const { content } = number === 0 ? first : await pageOf(number);
    const place = content.findIndex((vendor) => vendor.id === vendorId);
    if (place >= 0) return number * vendorsInAnAnswer + place;
  }
  return undefined;
}

// Opens the Referrals screen, in the Admin's page, at the page that holds
// the Vendor, by the page in the list's address, and gives back its row.
export async function findOnTheReferrals(
  page: Page,
  request: APIRequestContext,
  authorization: string,
  vendor: { id: string; name: string },
  from: LookedForFrom,
): Promise<Locator> {
  const place = await placeOnTheList(request, authorization, vendor.id, from);
  expect(place, 'the made-up Vendor is on the list').toBeDefined();
  const number = Math.floor((place as number) / vendorsOnAPage) + 1;
  await page.goto(number === 1 ? referralsUrl : `${referralsUrl}?page=${number}`);
  await expect(theReferralsHeading(page)).toBeVisible();
  await expect(vendorsListedOnTheReferrals(page).first()).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const row = vendorsListedOnTheReferrals(page).filter({ hasText: vendor.name });
  await expect(row, 'the made-up Vendor is on its page of the list').toHaveCount(1);
  return row;
}
