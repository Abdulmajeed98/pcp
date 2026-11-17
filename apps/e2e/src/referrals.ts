import { type APIRequestContext, expect } from '@playwright/test';

import { apiUrl } from './platform';

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
