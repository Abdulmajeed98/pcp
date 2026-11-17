import type { VendorsReferralCountResponse } from '@pcp/api-client';

import { madeUpIdentifier, madeUpVendors } from './made-up-vendors.ts';

// How many Referrals name each of the made-up Vendors (`made-up-vendors.ts`),
// over all time, for the Admin console's Referrals screen and the Vendor
// portal's count (sharing ticket 03). It holds the worst cases the screens
// must draw: the shop's own Vendor with a count in the thousands, three
// Vendors tied on a count, so that their names decide their order, several
// with none, the longest name among them, and one deactivated Vendor, which
// keeps its Referrals. The Vendors that gave no WhatsApp number, "Pretend
// Tech" and the three sharing ticket 02 left without one, have none, since
// no Shopper could have sent them a Build.
const counts: ReadonlyMap<string, number> = new Map(
  (
    [
      [1, 1284],
      [2, 312],
      [3, 312],
      [4, 0],
      [5, 46],
      [6, 312],
      [7, 187],
      [8, 95],
      [9, 0],
      [10, 0],
      [11, 0],
      [12, 0],
      [13, 21],
      [14, 0],
      [15, 0],
      [16, 0],
      [17, 3],
      [18, 2],
      [19, 1],
      [20, 1],
      [21, 140],
    ] as const
  ).map(([counter, count]) => [madeUpIdentifier(counter), count]),
);

// The one deactivated Vendor: "Imaginary Gaming Corner", which Shoppers see
// with no Visible Offer, as a deactivated Vendor's Offers are not.
const deactivated = new Set([madeUpIdentifier(5)]);

// Names compared as the development database's collation, `en_US.utf8`,
// orders them, as near as JavaScript comes: the two agree on every made-up
// name. The API's order is the one that counts; the shop states it because
// no fixed list could carry it.
const byName = new Intl.Collator('en').compare;

// Every made-up Vendor with its count, in the API's order: the most
// Referrals first, then by name, then by identifier.
export const madeUpReferralCounts: readonly VendorsReferralCountResponse[] = madeUpVendors
  .map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    active: !deactivated.has(vendor.id),
    count: counts.get(vendor.id) ?? 0,
  }))
  .sort((a, b) => b.count - a.count || byName(a.name, b.name) || a.id.localeCompare(b.id));
