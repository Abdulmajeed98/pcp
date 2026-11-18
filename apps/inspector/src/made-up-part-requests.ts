import type { PartRequestWithVendorResponse, PartSummaryResponse } from '@pcp/api-client';

import {
  type CatalogPart,
  ryzen9800X3D,
  theLongestName,
  tuf7800XT,
} from './made-up-offers.ts';
import {
  madeUpReferralCounts,
  referralCountsAtTheirWorst,
} from './made-up-referral-counts.ts';
import { madeUpIdentifier, madeUpVendors } from './made-up-vendors.ts';
import { calendarDaysBetween, theDayOf } from './the-platforms-day.ts';

// The made-up Part Requests, which the dashboard's Part Request pieces are
// designed and inspected with (the part-requests spec's The inspector):
// the Vendor portal's list of the shop's own Vendor, "Made-up PC Parts", and
// the Admin console's queue of open requests of every made-up Vendor, a
// Deactivated one among them. They come in every state: open, one of them
// sent 40 days ago, whose Offer would be an Expired Offer; fulfilled, one
// whose Offer the shop still holds and one whose Offer was removed; and
// rejected with a long reason.
//
// What a Vendor writes in a request is made up and says so, as the Vendors'
// names do: a request names a Part the catalog lacks, so its brands are
// pretend ones. A fulfilled request's Part is a real Part of the catalog
// (ADR-0001), read by its Category and exact name when the command starts.
// Everything is typed by the API client's types, so a change to the API's
// answers fails the type-check.

const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;

// How long an Offer stays current, as the API's expiry rule has it: an
// Offer a fulfilment makes is confirmed at the moment its request was sent,
// so it would be an Expired Offer more than 14 days after that moment.
const daysAnOfferStaysCurrent = 14;

type Category = PartSummaryResponse['category'];

// How a made-up request was resolved, if it was: fulfilled with a Part of
// the catalog, whose Offer the shop holds (`offerId` from the shop's Offers)
// or which the Vendor has removed since; or rejected with a reason.
type Resolution =
  | { fulfilledWith: CatalogPart; offer: 'held' | 'removed'; resolvedAgo: Ago }
  | { rejectedBecause: string; resolvedAgo: Ago };

interface Ago {
  days: number;
  hours: number;
}

// A Part Request as it is written here: which made-up Vendor sent it, by its
// counter in `made-up-vendors.ts` or as a Vendor of its own, what the Vendor
// wrote, its Offer's details, how long ago it was sent and how it was
// resolved.
export interface MadeUpPartRequest {
  counter: number;
  vendor: number | PartRequestWithVendorResponse['vendor'];
  category: Category;
  name: string;
  partNumber: string;
  prices: { usd: string } | { iqd: number } | { usd: string; iqd: number };
  inStock: boolean;
  warrantyMonths: number | null;
  sentAgo: Ago;
  resolution?: Resolution;
}

function ago(days: number, hours = 0): Ago {
  return { days, hours };
}

// The shop's own Vendor.
const theShop = 1;

// The made-up shop's Part Requests, as its screens always show them: the
// shop's own in every state, newest first as its list orders them, then the
// open requests of other Vendors, which only the queue shows.
const madeUpPartRequests: readonly MadeUpPartRequest[] = [
  {
    counter: 600001,
    vendor: theShop,
    category: 'storage',
    name: 'Samsung 990 PRO 2TB with Heatsink',
    partNumber: 'MZ-V9P2T0CW',
    prices: { usd: '175.00', iqd: 276000 },
    inStock: true,
    warrantyMonths: 60,
    sentAgo: ago(0, 2),
  },
  {
    counter: 600002,
    vendor: theShop,
    category: 'cpuCooler',
    name: 'Pretend Frostline 240 ARGB Liquid Cooler',
    partNumber: 'PFL-240-ARGB-BK',
    prices: { iqd: 95000 },
    inStock: true,
    warrantyMonths: 24,
    sentAgo: ago(3, 5),
  },
  {
    counter: 600003,
    vendor: theShop,
    category: 'gpu',
    name: 'ASUS TUF Gaming RX 7800 XT OC 16GB',
    partNumber: 'TUF-RX7800XT-O16G-GAMING',
    prices: { iqd: 820000 },
    inStock: true,
    warrantyMonths: null,
    sentAgo: ago(8, 2),
    resolution: { fulfilledWith: tuf7800XT, offer: 'held', resolvedAgo: ago(6, 4) },
  },
  {
    counter: 600004,
    vendor: theShop,
    category: 'motherboard',
    name: 'Sample B650M-E WiFi Micro ATX',
    partNumber: 'SB650ME-WIFI',
    prices: { usd: '139.00' },
    inStock: false,
    warrantyMonths: 36,
    sentAgo: ago(12, 1),
    resolution: {
      rejectedBecause:
        'The part number SB650ME-WIFI matches no board its maker lists, and the name matches none we know. Check the label on the box, write the code printed under its barcode, and send a new request, so that the Part is added with the right specifications.',
      resolvedAgo: ago(10, 3),
    },
  },
  {
    counter: 600005,
    vendor: theShop,
    category: 'cpu',
    name: 'Ryzen 7 9800X3D tray',
    partNumber: '100-000001084',
    prices: { usd: '459.00' },
    inStock: false,
    warrantyMonths: 12,
    sentAgo: ago(30, 6),
    resolution: { fulfilledWith: ryzen9800X3D, offer: 'removed', resolvedAgo: ago(25, 2) },
  },
  {
    counter: 600006,
    vendor: theShop,
    category: 'psu',
    name: 'Pretend PowerCore 750W 80+ Gold Fully Modular',
    partNumber: 'PPC-750G-FM',
    prices: { usd: '79.00', iqd: 125000 },
    inStock: true,
    warrantyMonths: 36,
    sentAgo: ago(40, 3),
  },
  // Other Vendors' open requests, for the queue.
  {
    counter: 600101,
    vendor: 2,
    category: 'ram',
    name: 'Pretend Vortex 16GB (2x8GB) DDR4 3200 CL16',
    partNumber: 'PVX-16G-3200',
    prices: { iqd: 42000 },
    inStock: true,
    warrantyMonths: 12,
    sentAgo: ago(18, 7),
  },
  {
    counter: 600102,
    vendor: 3,
    category: 'case',
    name: 'Sample Airflow M3 Micro ATX Case White',
    partNumber: 'SAM3-WH',
    prices: { iqd: 65000 },
    inStock: true,
    warrantyMonths: null,
    sentAgo: ago(9, 4),
  },
  {
    counter: 600103,
    vendor: 4,
    category: 'gpu',
    name: 'Imaginary Storm RTX 5060 Ti 16GB Twin Fan',
    partNumber: 'IS-5060TI-16G-TF',
    prices: { usd: '449.00' },
    inStock: true,
    warrantyMonths: 24,
    sentAgo: ago(1, 3),
  },
  {
    // The Deactivated Vendor's: a request can be fulfilled or rejected
    // whatever its Vendor's state.
    counter: 600104,
    vendor: 5,
    category: 'cpu',
    name: 'Intel Core i5-14400F tray',
    partNumber: 'CM8071505093012',
    prices: { usd: '125.00', iqd: 197000 },
    inStock: true,
    warrantyMonths: 12,
    sentAgo: ago(22, 0),
  },
  {
    counter: 600105,
    vendor: 13,
    category: 'motherboard',
    name: 'Sample H610M-K DDR4 Micro ATX',
    partNumber: 'SH610MK-D4',
    prices: { iqd: 98000 },
    inStock: false,
    warrantyMonths: 12,
    sentAgo: ago(5, 8),
  },
  {
    counter: 600106,
    vendor: 16,
    category: 'storage',
    name: 'Pretend NV3 1TB M.2 NVMe SSD',
    partNumber: 'PNV3-1TB',
    prices: { iqd: 64000 },
    inStock: true,
    warrantyMonths: 36,
    sentAgo: ago(0, 5),
  },
];

// The worst a request can be, for `break-ui` on both lists and one
// request's screen: each a value the API takes, the shop's own Vendor's,
// so that its portal shows them, older than every other open request, so
// that the queue shows them on its first page.
const theShopsWorst: readonly MadeUpPartRequest[] = [
  {
    // The longest name and part number the API takes, 300 and 100 code
    // points, at the highest prices it takes, waiting hundreds of days.
    counter: 610001,
    vendor: theShop,
    category: 'motherboard',
    name: 'Pretend Hyperion X870E Extreme Gaming WiFi 7 AM5 DDR5 E-ATX Motherboard with five M.2 slots, PCIe 5.0 x16, 10 Gb LAN, USB4 40 Gbps, 24+2+1 power stages, Wi-Fi 7 and Bluetooth 5.4, dual BIOS, debug LEDs, three ARGB headers, front USB-C 60 W, with antenna, M.2 heatsinks, SATA cables, quick start guide',
    partNumber:
      'PHX870E-EXTREME-WIFI7-AM5-DDR5-EATX-REV1.2-RETAIL-BOX-EU-90MB1JR0-M0EAY0-MADE-UP-NOT-A-REAL-CODE-001',
    prices: { usd: '100000.00', iqd: 150000000 },
    inStock: true,
    warrantyMonths: 120,
    sentAgo: ago(412, 4),
  },
  {
    // A name and a part number with no space to break at, at the lowest
    // price in dollars.
    counter: 610002,
    vendor: theShop,
    category: 'gpu',
    name: 'PretendROGStrixGeForceRTX5090OC32GBGDDR7WhiteEditionAuraSyncARGBTripleFanDualBIOSGamingGraphicsCard',
    partNumber: 'PRETENDROGASTRIXRTX5090O32GGAMINGWHITEEDITION',
    prices: { usd: '0.01' },
    inStock: false,
    warrantyMonths: null,
    sentAgo: ago(301, 2),
  },
  {
    // A name in Kurdish, as a Vendor may write it, at the lowest price in
    // dinars.
    counter: 610003,
    vendor: theShop,
    category: 'gpu',
    name: 'کارتی گرافیکی خەیاڵی RTX 5070 بە 12 گێگابایت بیرگە و سێ پانکە، ڕەنگی سپی',
    partNumber: 'KGX-5070-12G-W',
    prices: { iqd: 1 },
    inStock: true,
    warrantyMonths: 6,
    sentAgo: ago(200, 9),
  },
  {
    // A name in Arabic.
    counter: 610004,
    vendor: theShop,
    category: 'cpu',
    name: 'معالج تجريبي Core i7 من الجيل الرابع عشر بعشرين نواة للألعاب والعمل',
    partNumber: 'MT-I7-14-20C',
    prices: { usd: '389.50', iqd: 613000 },
    inStock: true,
    warrantyMonths: 36,
    sentAgo: ago(120, 1),
  },
  {
    // A name that starts with a digit, which has no direction of its own.
    counter: 610005,
    vendor: theShop,
    category: 'storage',
    name: '2TB Pretend NV3 M.2 2280 PCIe 4.0 NVMe SSD',
    partNumber: '2TB-PNV3-M2',
    prices: { iqd: 128000 },
    inStock: true,
    warrantyMonths: 36,
    sentAgo: ago(60, 0),
  },
  {
    // Rejected with the longest reason the API takes, 300 code points, in
    // Kurdish, as the Admin may write it.
    counter: 610006,
    vendor: theShop,
    category: 'case',
    name: 'Pretend Glasshouse 360 Mid-Tower Case',
    partNumber: 'PGH-360-BK',
    prices: { iqd: 89000 },
    inStock: true,
    warrantyMonths: 12,
    sentAgo: ago(95, 2),
    resolution: {
      rejectedBecause:
        'ئەم ژمارەیە لە هیچ لیستێکی دروستکەرەکەدا نییە و ناوەکەش لەگەڵ هیچ پارچەیەکی ناسراودا ناگونجێت. تکایە سەیری لەیبڵی سەر قوتووەکە بکە و ئەو ژمارەیەی لە ژێر بارکۆدەکەدا نووسراوە بنووسە، پاشان داواکارییەکی نوێ بنێرە تا بە تایبەتمەندییە ڕاستەکانەوە زیادی بکەین. ئەگەر قوتووەکەت لا نییە، پەیوەندیم پێوە بکە.',
      resolvedAgo: ago(94, 0),
    },
  },
  {
    // Fulfilled with the longest name the catalog holds, 276 characters,
    // whose Offer the Vendor has removed since.
    counter: 610007,
    vendor: theShop,
    category: 'cpuCooler',
    name: 'Corsair H100i RGB Platinum',
    partNumber: 'CW-9060039-WW',
    prices: { usd: '139.00', iqd: 219000 },
    inStock: true,
    warrantyMonths: 60,
    sentAgo: ago(150, 0),
    resolution: {
      fulfilledWith: theLongestName,
      offer: 'removed',
      resolvedAgo: ago(149, 5),
    },
  },
];

// A Vendor of the Referral counts' worst cases, by its counter there: the
// longest name the API takes, and a deactivated one written as its
// Instagram name, with no space.
function worstVendor(counter: number): PartRequestWithVendorResponse['vendor'] {
  const vendor = referralCountsAtTheirWorst.worstCase.find(
    (each) => each.id === madeUpIdentifier(counter),
  );
  if (vendor === undefined) throw new Error(`No worst Vendor ${counter}.`);
  return { id: vendor.id, name: vendor.name, active: vendor.active };
}

// Other Vendors' requests at their worst, for the queue: open, as old as the
// shop's worst, from the Vendors whose names are longest.
const otherWorst: readonly MadeUpPartRequest[] = [
  {
    counter: 610101,
    vendor: worstVendor(900001),
    category: 'psu',
    name: 'Pretend PowerCore 1200W 80+ Platinum ATX 3.1',
    partNumber: 'PPC-1200P-31',
    prices: { usd: '219.00' },
    inStock: true,
    warrantyMonths: 120,
    sentAgo: ago(250, 0),
  },
  {
    counter: 610102,
    vendor: worstVendor(900002),
    category: 'ram',
    name: 'Pretend Vortex 64GB (2x32GB) DDR5 6000 CL30',
    partNumber: 'PVX-64G-6000',
    prices: { iqd: 298000 },
    inStock: true,
    warrantyMonths: 24,
    sentAgo: ago(180, 0),
  },
];

// How many open requests the queue holds at its worst: thousands, the
// first pages the worst cases above, the rest sent in the last month by the
// made-up Vendors in turn.
export const theQueueAtItsWorst = 2486;

const fillerNames: readonly [Category, string, string][] = [
  ['cpu', 'Pretend Core i5-13400 tray', 'PC-I5-13400-T'],
  ['cpuCooler', 'Sample Tower 120 Air Cooler Black', 'ST-120-BK'],
  ['motherboard', 'Imaginary B760M-A WiFi DDR4', 'IB760MA-W4'],
  ['ram', 'Pretend Vortex 32GB (2x16GB) DDR5 5600', 'PVX-32G-5600'],
  ['storage', 'Sample 1TB SATA SSD 2.5"', 'S1T-SATA-25'],
  ['gpu', 'Imaginary Storm RX 7600 8GB', 'IS-7600-8G'],
  ['case', 'Pretend Cube Mini ITX Case', 'PCB-ITX'],
  ['psu', 'Sample Bronze 650W', 'SB-650'],
];

function fillers(howMany: number): MadeUpPartRequest[] {
  return Array.from({ length: howMany }, (_, index): MadeUpPartRequest => {
    const [category, name, partNumber] = fillerNames[index % fillerNames.length];
    return {
      counter: 620001 + index,
      vendor: 2 + (index % (madeUpVendors.length - 1)),
      category,
      name: `${name} #${index + 1}`,
      partNumber: `${partNumber}-${index + 1}`,
      prices: { iqd: 50000 + (index % 40) * 2500 },
      inStock: index % 7 !== 0,
      warrantyMonths: index % 5 === 0 ? null : 12,
      // From 29 days ago to now, an hour apart, the newest last.
      sentAgo: ago(0, Math.round(((howMany - index) * 29 * 24) / howMany)),
    };
  });
}

const theShopsOnly: readonly MadeUpPartRequest[] = [
  {
    counter: 630001,
    vendor: theShop,
    category: 'cpuCooler',
    name: 'Pretend Frostline 240 ARGB Liquid Cooler',
    partNumber: 'PFL-240-ARGB-BK',
    prices: { iqd: 95000 },
    inStock: true,
    warrantyMonths: 24,
    sentAgo: ago(2, 0),
  },
];

const withoutFillers = [...madeUpPartRequests, ...theShopsWorst, ...otherWorst];

// The requests shown: the made-up ones; the same at their worst, beside the
// worst cases and with the queue filled to thousands; one open request of
// the shop's; or none at all.
export const partRequestsShown = {
  madeUp: madeUpPartRequests,
  worstCase: [
    ...withoutFillers,
    ...fillers(
      theQueueAtItsWorst -
        withoutFillers.filter((request) => request.resolution === undefined).length,
    ),
  ],
  one: theShopsOnly,
  none: [],
} satisfies Record<string, readonly MadeUpPartRequest[]>;

export type PartRequestsShown = keyof typeof partRequestsShown;

// The Parts of the catalog the made-up requests were fulfilled with, which
// the command reads from the catalog beside those the shop offers.
export const partsThePartRequestsWereFulfilledWith: readonly CatalogPart[] = [
  ryzen9800X3D,
  theLongestName,
];

// A made-up Vendor as a Part Request names it: its name, and whether it is
// active, as the Referral counts list it.
function sendingVendor(counter: number): PartRequestWithVendorResponse['vendor'] {
  const vendor = madeUpReferralCounts.find((each) => each.id === madeUpIdentifier(counter));
  if (vendor === undefined) throw new Error(`No made-up Vendor ${counter}.`);
  return { id: vendor.id, name: vendor.name, active: vendor.active };
}

// A Part Request as the shop holds it: everything the API answers but what
// it counts at the moment it answers (`asAnsweredAt`).
export type HeldPartRequest = Omit<
  PartRequestWithVendorResponse,
  'sentOn' | 'daysSinceSent' | 'offerWouldBeExpired'
>;

// The requests at `now`, with the Parts the catalog gave for their names and
// the shop's Offers, by Part, for a fulfilled request's `offerId`.
export function thePartRequestsAt(
  now: Date,
  requests: readonly MadeUpPartRequest[],
  catalogParts: ReadonlyMap<string, PartSummaryResponse>,
  offerIdOf: ReadonlyMap<string, string>,
): HeldPartRequest[] {
  const before = ({ days, hours }: Ago) =>
    new Date(now.getTime() - days * aDay - hours * anHour).toISOString();
  return requests.map((request): HeldPartRequest => {
    const held: HeldPartRequest = {
      id: madeUpIdentifier(request.counter),
      category: request.category,
      name: request.name,
      partNumber: request.partNumber,
      usdPrice: 'usd' in request.prices ? request.prices.usd : null,
      iqdPrice: 'iqd' in request.prices ? request.prices.iqd : null,
      inStock: request.inStock,
      warrantyMonths: request.warrantyMonths,
      sentAt: before(request.sentAgo),
      state: 'open',
      vendor:
        typeof request.vendor === 'number' ? sendingVendor(request.vendor) : request.vendor,
    };
    const { resolution } = request;
    if (resolution === undefined) return held;
    if ('rejectedBecause' in resolution) {
      return {
        ...held,
        state: 'rejected',
        reason: resolution.rejectedBecause,
        resolvedAt: before(resolution.resolvedAgo),
      };
    }
    const part = catalogParts.get(resolution.fulfilledWith.name);
    if (part === undefined) {
      throw new Error(`The catalog gave no Part named "${resolution.fulfilledWith.name}".`);
    }
    return {
      ...held,
      state: 'fulfilled',
      part,
      offerId: resolution.offer === 'held' ? (offerIdOf.get(part.id) ?? null) : null,
      resolvedAt: before(resolution.resolvedAgo),
    };
  });
}

// A request as the API answers it at `now`: the day it was sent in Iraq's
// time and the calendar days since, by the rule `sharing` wrote once, and
// whether the Offer a fulfilment makes would be an Expired Offer, by the
// expiry rule. The API's are the rules that count; the shop states them
// because no fixed data can carry what changes with the clock.
export function asAnsweredAt(
  request: HeldPartRequest,
  now: Date,
): PartRequestWithVendorResponse {
  const sentAt = new Date(request.sentAt);
  return {
    ...request,
    sentOn: theDayOf(sentAt),
    daysSinceSent: calendarDaysBetween(sentAt, now),
    offerWouldBeExpired: now.getTime() - sentAt.getTime() > daysAnOfferStaysCurrent * aDay,
  };
}
