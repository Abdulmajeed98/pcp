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

// Vendors with their counts in the API's order: the most Referrals first,
// then by name, then by identifier.
function inTheApisOrder(
  vendors: readonly VendorsReferralCountResponse[],
): VendorsReferralCountResponse[] {
  return [...vendors].sort(
    (a, b) => b.count - a.count || byName(a.name, b.name) || a.id.localeCompare(b.id),
  );
}

// Every made-up Vendor with its count, in the API's order.
export const madeUpReferralCounts: readonly VendorsReferralCountResponse[] = inTheApisOrder(
  madeUpVendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    active: !deactivated.has(vendor.id),
    count: counts.get(vendor.id) ?? 0,
  })),
);

// The Referrals screen's worst cases, for `break-ui` (the sharing spec's
// The design comes first; the code review's fixes): every made-up Vendor
// above with its count, and beside them the Vendors the screen meets at
// its worst, each a value the API takes, spread across the first rows,
// where the screen shows them first. A name is at most 100 characters
// (`longestVendorName`), in any script; a count has no limit but the
// years, so the most is a Vendor sent Builds a hundred times a day for
// three and a half years.
const worstVendors: readonly { name: string; count: number; active: boolean }[] = [
  // The longest name the API takes, in Latin letters, ending in a stop.
  {
    name: 'Invented Components & Accessories Trading Company for Computers, Laptops, Gaming PCs and Networking.',
    count: 128406,
    active: true,
  },
  // A name written as its Instagram name, with no space to break at, and
  // deactivated with a count in the tens of thousands.
  {
    name: 'pc.parts.and.gaming.accessories.wholesale.official',
    count: 12750,
    active: false,
  },
  // A long name in Arabic script and one in Kurdish.
  {
    name: 'شركة التقنيات الوهمية لتجارة الحاسبات وملحقاتها وأجهزة الألعاب والشبكات والكاميرات والطابعات',
    count: 3108,
    active: true,
  },
  {
    name: 'کۆگای ئەلیکترۆنیاتی خەیاڵی بۆ پارچەکانی کۆمپیوتەر و لاپتۆپ و یاری و تۆڕ و کامێرا و چاپکەر',
    count: 1999,
    active: true,
  },
  // Names that start or end with what has no direction of its own: a
  // digit, a mark, an emoji; and one in two scripts.
  { name: 'PC 4U کۆمپیوتەر', count: 312, active: true },
  { name: 'Gamer Zone 🎮', count: 312, active: true },
  { name: '3D Hardware', count: 312, active: true },
  // One word with no space, long enough to cross a phone's row.
  { name: 'ComputerWarehouseWholesaleAndRetailPartsSupplier', count: 27, active: true },
  // Two letters, one Referral.
  { name: 'A1', count: 1, active: true },
  // A deactivated Vendor with none.
  { name: 'Ali & Sons!', count: 0, active: false },
];

// The list at its worst, in the API's order, and the list of one Vendor
// with one Referral, which the screen counts as "1 Vendor" and "1
// Referral"; and, for no Vendor at all, an empty list.
export const referralCountsAtTheirWorst = {
  worstCase: inTheApisOrder([
    ...madeUpReferralCounts,
    ...worstVendors.map((vendor, place) => ({
      id: madeUpIdentifier(900001 + place),
      ...vendor,
    })),
  ]),
  one: [{ id: madeUpIdentifier(900101), name: 'Made-up PC Parts', active: true, count: 1 }],
  none: [],
} satisfies Record<string, readonly VendorsReferralCountResponse[]>;

export type ReferralCountsShown = 'madeUp' | keyof typeof referralCountsAtTheirWorst;
