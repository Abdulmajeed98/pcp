import type {
  ErrorResponse,
  ListedOfferResponse,
  OfferResponse,
  PartPageResponse,
  PartSummaryResponse,
  VendorPageResponse,
  VendorResponse,
  VendorsOfferCountsResponse,
  VendorsOffersPageResponse,
  VendorsWithExpiringOffersPageResponse,
} from '@pcp/api-client';

// One obviously fictional shop, a Vendor with about a dozen Offers in every
// state a Vendor can see: confirmed today, confirmed some days ago, about to
// expire, expired, out of stock, and with no warranty stated. The inspector's
// Chrome is answered from it for every call about Vendors and Offers, because
// the API stamps each Confirmation with the moment it is made, so no Offer
// about to expire or expired can be made through it, and nothing may be
// written to the development database for a look at the screens. No real
// Vendor is invented (PRODUCT.md's Evidence on Hand): the name, the
// addresses and every number say that the shop is made up.
//
// Its Offers name real Parts of the catalog (ADR-0001), by their Category and
// their exact name, and the Parts themselves come from the API when the
// command starts. Everything here is typed by the API client's types, so a
// change to the API's answers fails the type-check.

// A day of 24 hours, and the rules of an Offer's expiry, as the API states
// them in its description: an Offer is an Expired Offer when its last
// Confirmation is more than 14 days old, and about to expire when it is not
// expired and will be within 3 days.
const aDay = 24 * 60 * 60 * 1000;
const anHour = 60 * 60 * 1000;
const daysAnOfferStaysCurrent = 14;
const daysOfWarning = 3;

// A Part of the catalog, as the shop names it.
export interface CatalogPart {
  category: PartSummaryResponse['category'];
  name: string;
}

// What the shop says about one of its Offers, apart from the Part: how long
// ago it was last confirmed, its prices, its stock and its warranty.
interface MadeUpOffer {
  part: CatalogPart;
  confirmedAgo: { days: number; hours: number };
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
}

const madeUpOffers: readonly MadeUpOffer[] = [
  {
    part: { category: 'cpu', name: 'AMD Ryzen 7 7800X3D' },
    confirmedAgo: { days: 0, hours: 2 },
    usdPrice: '365.00',
    iqdPrice: 575000,
    inStock: true,
    warrantyMonths: 12,
  },
  {
    part: {
      category: 'gpu',
      name: 'Palit Dual OC GeForce RTX 4070 SUPER 12GB GDDR6X Black',
    },
    confirmedAgo: { days: 0, hours: 5 },
    usdPrice: null,
    iqdPrice: 950000,
    inStock: true,
    warrantyMonths: null,
  },
  {
    part: {
      category: 'storage',
      name: 'Western Digital WD_Black SN850X 1TB SSD M.2 PCIe 4.0 NVMe',
    },
    confirmedAgo: { days: 1, hours: 4 },
    usdPrice: '79.00',
    iqdPrice: null,
    inStock: false,
    warrantyMonths: 60,
  },
  {
    part: { category: 'cpu', name: 'AMD Ryzen 5 7600X' },
    confirmedAgo: { days: 2, hours: 6 },
    usdPrice: '189.00',
    iqdPrice: 298000,
    inStock: true,
    warrantyMonths: 12,
  },
  {
    part: {
      category: 'gpu',
      name: 'NVIDIA GeForce RTX 4070 SUPER 12GB GDDR6X Founders Edition',
    },
    confirmedAgo: { days: 3, hours: 1 },
    usdPrice: '599.00',
    iqdPrice: null,
    inStock: false,
    warrantyMonths: null,
  },
  {
    part: { category: 'motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX' },
    confirmedAgo: { days: 5, hours: 3 },
    usdPrice: '215.00',
    iqdPrice: null,
    inStock: true,
    warrantyMonths: 24,
  },
  {
    part: {
      category: 'case',
      name: 'Corsair 4000D AIRFLOW Tempered Glass Mid-Tower ATX Case - Black',
    },
    confirmedAgo: { days: 6, hours: 8 },
    usdPrice: null,
    iqdPrice: 135000,
    inStock: true,
    warrantyMonths: 12,
  },
  {
    part: {
      category: 'gpu',
      name: 'Asus TUF GAMING OC Radeon RX 7800 XT 16GB GDDR6 Black',
    },
    confirmedAgo: { days: 8, hours: 2 },
    usdPrice: null,
    iqdPrice: 820000,
    inStock: true,
    warrantyMonths: null,
  },
  {
    part: {
      category: 'psu',
      name: 'Corsair RM850e (2022) Black 850W Fully Modular 80+ Gold Certified',
    },
    confirmedAgo: { days: 11, hours: 1 },
    usdPrice: '124.00',
    iqdPrice: 195000,
    inStock: true,
    warrantyMonths: 84,
  },
  {
    part: { category: 'ram', name: 'CORSAIR Vengeance 32GB (2x16GB) DDR5 6000 CL30 Black' },
    confirmedAgo: { days: 12, hours: 3 },
    usdPrice: '109.00',
    iqdPrice: 172000,
    inStock: true,
    warrantyMonths: 24,
  },
  {
    part: { category: 'cpuCooler', name: 'Noctua NH-D15 chromax.black Air 165mm Black' },
    confirmedAgo: { days: 13, hours: 20 },
    usdPrice: '119.00',
    iqdPrice: null,
    inStock: true,
    warrantyMonths: 72,
  },
  {
    part: {
      category: 'cpuCooler',
      name: 'Thermalright Peerless Assassin 120 SE Air 155mm Black/Silver',
    },
    confirmedAgo: { days: 20, hours: 0 },
    usdPrice: null,
    iqdPrice: 52000,
    inStock: true,
    warrantyMonths: 6,
  },
  {
    part: {
      category: 'storage',
      name: 'Samsung 990 Pro 2TB SSD M.2-2280 PCIe 4.0 x4 NVMe',
    },
    confirmedAgo: { days: 45, hours: 0 },
    usdPrice: '169.00',
    iqdPrice: 266000,
    inStock: false,
    warrantyMonths: 60,
  },
];

// The Parts of the catalog the shop offers, which the command reads from the
// API before anything else.
export const partsTheShopOffers: readonly CatalogPart[] = madeUpOffers.map(
  (offer) => offer.part,
);

// The shop as the API would hold it.
export interface MadeUpShop {
  vendor: VendorResponse;
  offers: readonly OfferResponse[];
}

// Identifiers that say they are made up: zeros, and a counter.
function madeUpIdentifier(counter: number): string {
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

function before(now: Date, milliseconds: number): string {
  return new Date(now.getTime() - milliseconds).toISOString();
}

// The shop as it stands at `now`, its Offers confirmed that long before it,
// with the Parts the catalog gave for their names.
export function madeUpShop(
  now: Date,
  catalogParts: ReadonlyMap<string, PartSummaryResponse>,
): MadeUpShop {
  const vendor: VendorResponse = {
    id: madeUpIdentifier(1),
    name: 'Made-up PC Parts',
    city: 'erbil',
    address: '1 Made-up Street\nFictional Bazaar, Erbil',
    mapLocation: { latitude: 36.1911, longitude: 44.0092 },
    phoneNumber: { international: '+9647500000001', national: '0750 000 0001' },
    whatsAppNumber: { international: '+9647500000002', national: '0750 000 0002' },
    instagramName: 'made.up.pc.parts',
    openingHours: 'Saturday to Thursday, 10:00 to 21:00\nFriday closed',
    loginPhoneNumber: { international: '+9647500000003', national: '0750 000 0003' },
    active: true,
    createdAt: before(now, 90 * aDay),
    updatedAt: before(now, 7 * aDay),
  };

  const offers = madeUpOffers.map((offer, index): OfferResponse => {
    const part = catalogParts.get(offer.part.name);
    if (part === undefined) {
      throw new Error(`The catalog gave no Part named "${offer.part.name}".`);
    }
    const ago = offer.confirmedAgo.days * aDay + offer.confirmedAgo.hours * anHour;
    return {
      id: madeUpIdentifier(101 + index),
      part,
      usdPrice: offer.usdPrice,
      iqdPrice: offer.iqdPrice,
      inStock: offer.inStock,
      warrantyMonths: offer.warrantyMonths,
      confirmedAt: before(now, ago),
      createdAt: before(now, ago + 30 * aDay),
    };
  });

  return { vendor, offers };
}

// One call to the API, as the inspector's Chrome makes it: its method, and
// its path with its query, without the API's address.
export interface ApiCall {
  method: string;
  path: string;
}

// The shop's answer to a call: an HTTP status and a body, as the API would
// give them.
export interface ShopAnswer {
  status: number;
  body: unknown;
}

// An Offer as the Vendor's list shows it at `now`, with its age and expiry.
function listed(offer: OfferResponse, now: Date): ListedOfferResponse {
  const confirmedAt = new Date(offer.confirmedAt).getTime();
  const sinceConfirmation = now.getTime() - confirmedAt;
  const left = confirmedAt + daysAnOfferStaysCurrent * aDay - now.getTime();
  const expired = sinceConfirmation > daysAnOfferStaysCurrent * aDay;
  return {
    ...offer,
    daysSinceConfirmation: Math.floor(sinceConfirmation / aDay),
    daysLeft: Math.max(0, Math.floor(left / aDay)),
    expired,
    aboutToExpire: !expired && left < daysOfWarning * aDay,
  };
}

// Whether a Part's name, manufacturer or part numbers hold every word of a
// search, as the API's search of a Vendor's Offers keeps them.
function holdsEveryWord(part: PartSummaryResponse, words: readonly string[]): boolean {
  const text = [part.name, part.manufacturer, ...part.partNumbers].join(' ').toLowerCase();
  return words.every((word) => text.includes(word));
}

function counts(offers: readonly ListedOfferResponse[]): VendorsOfferCountsResponse {
  return {
    offers: offers.length,
    expired: offers.filter((offer) => offer.expired).length,
    aboutToExpire: offers.filter((offer) => offer.aboutToExpire).length,
    outOfStock: offers.filter((offer) => !offer.inStock).length,
  };
}

// Whether an Offer is in the state a call asks for, as the API's list of a
// Vendor's Offers keeps them: every one, those that need confirming, or
// those out of stock.
function isInState(offer: ListedOfferResponse, state: string | null): boolean {
  switch (state) {
    case 'needs-confirming':
      return offer.expired || offer.aboutToExpire;
    case 'out-of-stock':
      return !offer.inStock;
    default:
      return true;
  }
}

// The paging of a list the API answers a page at a time: its page and size
// as the call asks for them, and what the API says about the page.
function paged<Item>(address: URL, items: readonly Item[]) {
  const page = Number(address.searchParams.get('page') ?? 0);
  const size = Number(address.searchParams.get('size') ?? 20);
  return {
    pageNumber: page,
    pageSize: size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    first: page === 0,
    last: (page + 1) * size >= items.length,
    content: items.slice(page * size, (page + 1) * size),
  };
}

// A refusal, in the API's shape.
function refusal(status: number, code: string, title: string): ShopAnswer {
  const body: ErrorResponse = { errors: [{ code, title, detail: title }] };
  return { status, body };
}

const notFound = refusal(404, 'NOT_FOUND', 'The made-up shop holds no such thing.');

// An Offer the shop does not hold, as the API answers one that does not
// exist, so that an Offer's screen says it no longer exists.
const offerNotFound = refusal(
  404,
  'OFFER_NOT_FOUND',
  'The made-up shop holds no such Offer.',
);

// Nothing is ever written: the shop is not in the database, and a change
// that reached the API would be written to the development database.
const readOnly = refusal(
  405,
  'MADE_UP_SHOP_IS_READ_ONLY',
  'The made-up shop is for looking at the screens, and cannot be changed.',
);

// Answers a call about Vendors or Offers from the shop, at `now`: every call
// whose path starts with `/v1/vendors`, `/v1/offers` or `/v1/caller/vendor`,
// but those that only read the real Vendors. The list of Vendors is the
// API's, with the shop's Vendor among them (`listsTheVendors`), and another
// Vendor's page and its Offers are the API's alone, so that the Vendors'
// screens show the shop among the development database's real Vendors (the
// end-to-end tests' leftovers). Every call that would write is refused, the
// real Vendors' included. Any other call is not the shop's, and is left to
// the API.
export function answerFromTheMadeUpShop(
  shop: MadeUpShop,
  now: Date,
  call: ApiCall,
): ShopAnswer | undefined {
  const address = new URL(call.path, 'http://api');
  const [version, first, second, ...rest] = address.pathname.split('/').filter(Boolean);
  const vendorsCall = first === 'vendors' || first === 'offers';
  const callersVendor = first === 'caller' && second === 'vendor';
  if (version !== 'v1' || !(vendorsCall || callersVendor)) return undefined;
  if (call.method !== 'GET') return readOnly;

  const listedOffers = listedOffersOf(shop, now);
  if (callersVendor) return { status: 200, body: shop.vendor };
  if (first === 'offers') {
    if (second !== 'expiring' || rest.length > 0) return notFound;
    const body: VendorsWithExpiringOffersPageResponse = paged(address, [
      {
        id: shop.vendor.id,
        name: shop.vendor.name,
        phoneNumber: shop.vendor.phoneNumber,
        whatsAppNumber: shop.vendor.whatsAppNumber,
        counts: counts(listedOffers),
      },
    ]);
    return { status: 200, body };
  }

  // The list of Vendors is the API's, joined with the shop's Vendor by
  // `vendorsWithTheShops`, and any other Vendor is the API's alone.
  if (second === undefined || second !== shop.vendor.id) return undefined;
  const [offers, offerId, ...beyond] = rest;
  if (offers === undefined) return { status: 200, body: shop.vendor };
  if (offers !== 'offers' || beyond.length > 0) return notFound;
  if (offerId !== undefined) {
    // One Offer is read with its expiry at the moment it is read, as the API
    // reads it and as its list shows it.
    const offer = listedOffers.find((each) => each.id === offerId);
    return offer === undefined ? offerNotFound : { status: 200, body: offer };
  }

  const words = (address.searchParams.get('search') ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== '');
  const state = address.searchParams.get('state');
  const found = listedOffers.filter(
    (offer) => isInState(offer, state) && holdsEveryWord(offer.part, words),
  );
  const body: VendorsOffersPageResponse = {
    ...paged(address, found),
    counts: counts(listedOffers),
  };
  return { status: 200, body };
}

// The shop's Offers as its list shows them at `now`: oldest Confirmation
// first, then by Part name.
function listedOffersOf(shop: MadeUpShop, now: Date): ListedOfferResponse[] {
  return shop.offers
    .map((offer) => listed(offer, now))
    .sort(
      (a, b) =>
        a.confirmedAt.localeCompare(b.confirmedAt) ||
        a.part.name.localeCompare(b.part.name),
    );
}

// Whether a call asks for a page of the list of Vendors, which the API
// answers and the shop joins (`vendorsWithTheShops`).
export function listsTheVendors(call: ApiCall): boolean {
  const { pathname } = new URL(call.path, 'http://api');
  return call.method === 'GET' && /^\/v1\/vendors\/?$/.test(pathname);
}

// The API's page of the list of Vendors with the shop's Vendor among them:
// on the first page, in name order among that page's Vendors, and counted
// with every Vendor on every page. The first page holds one row more than
// its size, so that the API's later pages stay as they are, and none of its
// Vendors is lost or shown twice. A refusal is left as it is.
export function vendorsWithTheShops(shop: MadeUpShop, api: ShopAnswer): ShopAnswer {
  if (api.status !== 200) return api;
  const page = api.body as VendorPageResponse;
  const theShops: VendorPageResponse['content'][number] = {
    id: shop.vendor.id,
    name: shop.vendor.name,
    loginPhoneNumber: shop.vendor.loginPhoneNumber,
    active: shop.vendor.active,
  };
  const body: VendorPageResponse = {
    ...page,
    totalElements: page.totalElements + 1,
    totalPages: Math.max(page.totalPages, 1),
    content:
      page.pageNumber === 0
        ? [...page.content, theShops].sort((a, b) => a.name.localeCompare(b.name))
        : page.content,
  };
  return { status: 200, body };
}

// Whether a call searches the catalog for the shop's Vendor, as the portal's
// catalog search does, and if so the API's own search, without the Vendor,
// which the API does not know: the Parts are the catalog's, and the shop
// marks those it offers (`partsWithTheShopsOffers`). Any other search of the
// catalog is the API's alone.
export function catalogSearchOfTheShop(
  shop: MadeUpShop,
  call: ApiCall,
): string | undefined {
  const address = new URL(call.path, 'http://api');
  if (call.method !== 'GET' || address.pathname !== '/v1/parts') return undefined;
  if (address.searchParams.get('vendorId') !== shop.vendor.id) return undefined;
  address.searchParams.delete('vendorId');
  return address.pathname + address.search;
}

// The API's page of a catalog search, each Part the shop offers marked with
// its Offer, as the API marks a Vendor's own.
export function partsWithTheShopsOffers(shop: MadeUpShop, api: ShopAnswer): ShopAnswer {
  if (api.status !== 200) return api;
  const page = api.body as PartPageResponse;
  const offerOf = new Map(shop.offers.map((offer) => [offer.part.id, offer.id]));
  const body: PartPageResponse = {
    ...page,
    content: page.content.map((part) => ({
      ...part,
      offerId: offerOf.get(part.id) ?? null,
    })),
  };
  return { status: 200, body };
}
