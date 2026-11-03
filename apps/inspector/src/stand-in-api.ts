import type {
  Currency,
  ErrorResponse,
  FilterKind,
  FilterResponse,
  LabelledSpecificationResponse,
  ListVisiblePartsData,
  PartSummaryResponse,
  SpecificationResponse,
  VisibleOfferOfVendorPageResponse,
  VisibleOfferOfVendorResponse,
  VisibleOfferResponse,
  VisiblePartPageResponse,
  VisiblePartResponse,
  VisiblePartsFiltersResponse,
  VisiblePartWithSpecificationsResponse,
  VisibleVendorResponse,
} from '@pcp/api-client';

import type { Category, ReadPart, ShopOffer, ShoppersShop } from './the-shoppers-shop.ts';

// The stand-in API: the answers the made-up shop gives to the public
// endpoints the Shopper app reads, as the API's description shapes them.
// It is a stand-in for looking at pages, never a second statement of the
// API's rules, and no test of the platform relies on it. It converts no
// price, since every price is fixed in both currencies, and judges no
// visibility, since the shop holds only Visible Offers of active Vendors. It
// only picks and pages its fixed Parts plainly. Every answer is typed by the
// API client's own types, so a change to the API's description that the
// shop does not follow fails the type-check.

// One request, as the Shopper app's server sends it: its method, and its
// path with its query.
export interface ApiCall {
  method: string;
  path: string;
}

// The stand-in's answer: an HTTP status, its headers, and a body of JSON or
// of bytes. `refused` says why it was not answered as the API would, for
// the log.
export interface StandInAnswer {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  refused?: string;
}

const json = { 'Content-Type': 'application/json; charset=utf-8' };

function answer(body: unknown): StandInAnswer {
  return { status: 200, headers: json, body };
}

// A refusal, in the API's shape.
function refusal(status: number, code: string): StandInAnswer {
  const key = code.toLowerCase();
  const body: ErrorResponse = {
    errors: [{ code, title: `${key}_title`, detail: `${key}_details` }],
  };
  return { status, headers: json, body };
}

// The refusal of a parameter, naming it, as the API refuses one.
function notValid(field: string): StandInAnswer {
  const body: ErrorResponse = {
    errors: [
      {
        code: 'NOT_VALID',
        title: 'not_valid_title',
        detail: 'not_valid_details',
        additionalInformation: { field },
      },
    ],
  };
  return { status: 400, headers: json, body };
}

const vendorNotFound = refusal(404, 'VENDOR_NOT_FOUND');

// A parameter the request got wrong, which the answer refuses.
class Refused extends Error {
  readonly answer: StandInAnswer;

  constructor(answer: StandInAnswer) {
    super('refused');
    this.answer = answer;
  }
}

const currencies: readonly Currency[] = ['USD', 'IQD'];

function currencyOf(query: URLSearchParams): Currency {
  const currency = currencies.find((each) => each === query.get('currency'));
  if (currency === undefined) throw new Refused(notValid('currency'));
  return currency;
}

// A whole number of the query from `lowest` to `highest`, or the default
// when it is left out.
function wholeNumberOf(
  query: URLSearchParams,
  name: string,
  { fallback, lowest, highest }: { fallback: number; lowest: number; highest: number },
): number {
  const text = query.get(name);
  if (text === null) return fallback;
  const value = Number(text);
  if (!/^\d+$/.test(text) || value < lowest || value > highest) {
    throw new Refused(notValid(name));
  }
  return value;
}

// One page of a list, as the API's paging answers it: `page` from 0 and
// `size` from 1 to 100, 10 when it is left out.
function aPageOf<Item>(query: URLSearchParams, items: readonly Item[]) {
  const page = wholeNumberOf(query, 'page', { fallback: 0, lowest: 0, highest: 1_000_000 });
  const size = wholeNumberOf(query, 'size', { fallback: 10, lowest: 1, highest: 100 });
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

// The catalog's fixed order of the eight Categories.
const categoriesInOrder: readonly Category[] = [
  'cpu',
  'cpuCooler',
  'motherboard',
  'ram',
  'storage',
  'gpu',
  'case',
  'psu',
];

function amountIn(offer: ShopOffer, currency: Currency): number {
  return Number(offer.shownPrices[currency].amount);
}

// In stock first, then the lowest Shown Price, then the most recent
// Confirmation.
function inStockThenCheapest(currency: Currency) {
  return (a: ShopOffer, b: ShopOffer) =>
    Number(b.inStock) - Number(a.inStock) ||
    amountIn(a, currency) - amountIn(b, currency) ||
    b.confirmedAt.localeCompare(a.confirmedAt);
}

function visibleVendor(shop: ShoppersShop, vendorId: string): StandInAnswer {
  const vendor = shop.vendors.find((each) => each.id === vendorId);
  if (vendor === undefined) return vendorNotFound;
  const body: VisibleVendorResponse = vendor;
  return answer(body);
}

// A Vendor's Offers, grouped by Category in the catalog's order, and within
// each in stock first, then the lowest Shown Price, the most recent
// Confirmation, and the Part's name.
function offersOfVendor(
  shop: ShoppersShop,
  vendorId: string,
  query: URLSearchParams,
): StandInAnswer {
  const currency = currencyOf(query);
  if (!shop.vendors.some((vendor) => vendor.id === vendorId)) return vendorNotFound;
  const partOf = (offer: ShopOffer) => partIn(shop, offer.partId);
  const offers = shop.offers
    .filter((offer) => offer.vendorId === vendorId)
    .sort(
      (a, b) =>
        categoriesInOrder.indexOf(partOf(a).category) -
          categoriesInOrder.indexOf(partOf(b).category) ||
        inStockThenCheapest(currency)(a, b) ||
        partOf(a).name.localeCompare(partOf(b).name) ||
        a.id.localeCompare(b.id),
    )
    .map((offer): VisibleOfferOfVendorResponse => ({
      ...detailsOf(offer, currency),
      part: partOf(offer),
    }));
  const body: VisibleOfferOfVendorPageResponse = aPageOf(query, offers);
  return answer(body);
}

// What an Offer says of itself, in the currency asked.
function detailsOf(offer: ShopOffer, currency: Currency) {
  return {
    usdPrice: offer.usdPrice,
    iqdPrice: offer.iqdPrice,
    shownPrice: offer.shownPrices[currency],
    inStock: offer.inStock,
    warrantyMonths: offer.warrantyMonths,
    confirmedAt: offer.confirmedAt,
    daysSinceConfirmation: offer.daysSinceConfirmation,
  };
}

const partNotFound = refusal(404, 'PART_NOT_FOUND');

// The value at a path of a Part's specifications, `cores.total` naming
// `cores` and then `total`.
export function valueAt(
  document: Readonly<Record<string, unknown>>,
  path: string,
): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (held, name) =>
        typeof held === 'object' && held !== null && !Array.isArray(held)
          ? (held as Record<string, unknown>)[name]
          : undefined,
      document,
    );
}

// Whether a Part holds nothing for a specification, as the API's description
// of a Part's specifications has it: no value, an empty text or list, or a
// 0 where the Category's list says 0 stands for "not known".
function lacks(specification: SpecificationResponse, value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && specification.kind !== 'listOfRows')
    return value.length === 0;
  return value === 0 && specification.zeroMeansMissing;
}

// What a Part holds for each specification of a list, beside its label and
// unit, in the list's order; a row of a list of rows, as the fields it holds.
function labelled(
  list: readonly SpecificationResponse[],
  document: Readonly<Record<string, unknown>>,
): LabelledSpecificationResponse[] {
  return list.flatMap((specification): LabelledSpecificationResponse[] => {
    const value = valueAt(document, specification.path);
    if (lacks(specification, value)) return [];
    if (specification.kind === 'listOfRows' && !Array.isArray(value)) return [];
    const held =
      specification.kind === 'listOfRows'
        ? (value as unknown[])
            .filter((row) => typeof row === 'object' && row !== null && !Array.isArray(row))
            .map((row) =>
              labelled(specification.fields ?? [], row as Record<string, unknown>),
            )
        : (value as LabelledSpecificationResponse['value']);
    return [
      {
        path: specification.path,
        label: specification.label,
        kind: specification.kind,
        unit: specification.unit ?? null,
        value: held,
      },
    ];
  });
}

function visiblePart(shop: ShoppersShop, partId: string): StandInAnswer {
  const read = shop.parts.get(partId);
  if (read === undefined) return partNotFound;
  const list = shop.categories.get(read.summary.category)?.specifications ?? [];
  const body: VisiblePartWithSpecificationsResponse = {
    ...read.summary,
    specifications: labelled(list, read.specifications),
  };
  return answer(body);
}

// The parameters a Category's list is narrowed by, beside its own, as the
// API's description names them.
type FilterParameter = Exclude<
  keyof ListVisiblePartsData['query'],
  | 'page'
  | 'size'
  | 'category'
  | 'currency'
  | 'search'
  | 'manufacturer'
  | 'lowest'
  | 'highest'
>;

// Which specification each of a Category's filters shows, in the order a
// form shows them, as the API's description of each parameter says. It is
// the made-up shop's own copy, for looking at the filters' form: a filter
// the API adds is not shown here until it is added below, and one it renames
// or drops fails the type-check.
const filtersOf: Record<Category, readonly { parameter: FilterParameter; path: string }[]> =
  {
    cpu: [
      { parameter: 'socket', path: 'socket' },
      { parameter: 'cores', path: 'cores.total' },
    ],
    cpuCooler: [
      { parameter: 'waterCooled', path: 'water_cooled' },
      { parameter: 'radiatorSize', path: 'radiator_size' },
    ],
    motherboard: [
      { parameter: 'socket', path: 'socket' },
      { parameter: 'formFactor', path: 'form_factor' },
      { parameter: 'ramType', path: 'memory.ram_type' },
    ],
    ram: [
      { parameter: 'ramType', path: 'ram_type' },
      { parameter: 'capacity', path: 'capacity' },
      { parameter: 'speed', path: 'speed' },
    ],
    storage: [
      { parameter: 'driveType', path: 'storage_type' },
      { parameter: 'capacity', path: 'capacity' },
      { parameter: 'interface', path: 'interface' },
    ],
    gpu: [
      { parameter: 'chipset', path: 'chipset' },
      { parameter: 'memory', path: 'memory' },
    ],
    case: [{ parameter: 'formFactor', path: 'form_factor' }],
    psu: [
      { parameter: 'wattage', path: 'wattage' },
      { parameter: 'efficiencyRating', path: 'efficiency_rating' },
    ],
  };

function categoryOf(query: URLSearchParams): Category {
  const category = categoriesInOrder.find((each) => each === query.get('category'));
  if (category === undefined) throw new Refused(notValid('category'));
  return category;
}

// A Visible Part as a Category's list shows it.
interface Listed {
  read: ReadPart;
  response: VisiblePartResponse;
}

// Every Part of a Category the shop offers, with its Lowest Price, the
// lowest Shown Price of its in-stock Offers, in BRW-1's order: a Lowest
// Price first, the lowest first, then those every Vendor has out of stock,
// then by name.
function listedParts(shop: ShoppersShop, category: Category, currency: Currency): Listed[] {
  return [...shop.parts.values()]
    .filter((read) => read.summary.category === category)
    .map((read): Listed => {
      const offers = shop.offers.filter((offer) => offer.partId === read.summary.id);
      const [cheapest] = offers
        .filter((offer) => offer.inStock)
        .sort(inStockThenCheapest(currency));
      return {
        read,
        response: {
          ...read.summary,
          lowestPrice: cheapest === undefined ? null : cheapest.shownPrices[currency],
          vendorCount: offers.length,
          inStock: cheapest !== undefined,
        },
      };
    })
    .sort((a, b) => {
      const [x, y] = [a.response.lowestPrice, b.response.lowestPrice];
      if (x === null || y === null) {
        if (x !== y) return x === null ? 1 : -1;
      } else if (Number(x.amount) !== Number(y.amount)) {
        return Number(x.amount) - Number(y.amount);
      }
      return (
        a.response.name.localeCompare(b.response.name) ||
        a.response.id.localeCompare(b.response.id)
      );
    });
}

// Whether a Part's name, manufacturer or part numbers hold every word.
function holdsEveryWord(part: PartSummaryResponse, words: readonly string[]): boolean {
  const text = [part.name, part.manufacturer, ...part.partNumbers].join(' ').toLowerCase();
  return words.every((word) => text.includes(word));
}

// Whether a Part holds one of the values asked of a filter, compared as the
// text the address carries them in.
function holdsOneOf(read: ReadPart, path: string, asked: readonly string[]): boolean {
  const value = valueAt(read.specifications, path);
  return value !== undefined && value !== null && asked.includes(String(value));
}

// A Category's list, picked and paged plainly for the queries the
// inspection uses: by search, manufacturer, filter and price range.
function visibleParts(shop: ShoppersShop, query: URLSearchParams): StandInAnswer {
  const category = categoryOf(query);
  const currency = currencyOf(query);
  const words = (query.get('search') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const manufacturers = query.getAll('manufacturer');
  const lowest = query.has('lowest') ? Number(query.get('lowest')) : undefined;
  const highest = query.has('highest') ? Number(query.get('highest')) : undefined;
  const filters = filtersOf[category]
    .map((filter) => ({ ...filter, asked: query.getAll(filter.parameter) }))
    .filter((filter) => filter.asked.length > 0);

  const picked = listedParts(shop, category, currency).filter(({ read, response }) => {
    const amount =
      response.lowestPrice === null ? undefined : Number(response.lowestPrice.amount);
    const inRange =
      (lowest === undefined && highest === undefined) ||
      (amount !== undefined &&
        (lowest === undefined || amount >= lowest) &&
        (highest === undefined || amount <= highest));
    return (
      holdsEveryWord(response, words) &&
      (manufacturers.length === 0 || manufacturers.includes(response.manufacturer)) &&
      filters.every((filter) => holdsOneOf(read, filter.path, filter.asked)) &&
      inRange
    );
  });
  const body: VisiblePartPageResponse = aPageOf(
    query,
    picked.map((listed) => listed.response),
  );
  return answer(body);
}

// The kind of value a filter offers, for each kind of specification a filter
// can show.
const kindOfValue: Partial<Record<SpecificationResponse['kind'], FilterKind>> = {
  wholeNumber: 'number',
  oneOf: 'text',
  text: 'text',
  yesNo: 'yesNo',
};

// Numbers by size, text alphabetically, and no before yes.
function inOrder(a: FilterResponse['values'][number], b: FilterResponse['values'][number]) {
  return typeof a === 'string' && typeof b === 'string'
    ? a.localeCompare(b)
    : Number(a) - Number(b);
}

// A Category's manufacturers and filters, each with the distinct values its
// Parts hold, and the range of their Lowest Prices.
function filtersOfCategory(shop: ShoppersShop, query: URLSearchParams): StandInAnswer {
  const category = categoryOf(query);
  const currency = currencyOf(query);
  const listed = listedParts(shop, category, currency);
  const list = shop.categories.get(category)?.specifications ?? [];
  const filters = filtersOf[category].flatMap(({ parameter, path }): FilterResponse[] => {
    const specification = list.find((each) => each.path === path);
    const kind = specification && kindOfValue[specification.kind];
    if (specification === undefined || kind === undefined) return [];
    const values = [
      ...new Set(
        listed
          .map(({ read }) => valueAt(read.specifications, path))
          .filter((value) => !lacks(specification, value))
          .map((value) => value as FilterResponse['values'][number]),
      ),
    ].sort(inOrder);
    if (values.length === 0) return [];
    return [
      {
        parameter,
        kind,
        ...(specification.unit === undefined ? {} : { unit: specification.unit }),
        values,
      },
    ];
  });
  const prices = listed
    .map(({ response }) => response.lowestPrice)
    .filter((price) => price !== null)
    .sort((a, b) => Number(a.amount) - Number(b.amount));
  const body: VisiblePartsFiltersResponse = {
    manufacturers: [...new Set(listed.map(({ response }) => response.manufacturer))].sort(
      (a, b) => a.localeCompare(b),
    ),
    filters,
    priceRange: {
      currency,
      lowest: prices.at(0)?.amount ?? null,
      highest: prices.at(-1)?.amount ?? null,
    },
  };
  return answer(body);
}

// A Part's Offers, in stock first, then the lowest Shown Price, the most
// recent Confirmation, and the Vendor's name.
function offersOfPart(shop: ShoppersShop, partId: string, query: URLSearchParams) {
  const currency = currencyOf(query);
  if (!shop.parts.has(partId)) return partNotFound;
  const vendorOf = (offer: ShopOffer) => {
    const vendor = shop.vendors.find((each) => each.id === offer.vendorId);
    if (vendor === undefined)
      throw new Error(`The shop holds no Vendor ${offer.vendorId}.`);
    return { id: vendor.id, name: vendor.name };
  };
  const body: VisibleOfferResponse[] = shop.offers
    .filter((offer) => offer.partId === partId)
    .sort(
      (a, b) =>
        inStockThenCheapest(currency)(a, b) ||
        vendorOf(a).name.localeCompare(vendorOf(b).name) ||
        a.id.localeCompare(b.id),
    )
    .map((offer) => ({ ...detailsOf(offer, currency), vendor: vendorOf(offer) }));
  return answer(body);
}

// A photo, with the headers the API serves one with: it never changes at its
// address, so it may be kept for a year, and the browser is told not to
// guess another type.
function photo(shop: ShoppersShop, photoId: string): StandInAnswer {
  const bytes = shop.photos.get(photoId);
  if (bytes === undefined) return refusal(404, 'PHOTO_NOT_FOUND');
  return {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
    body: bytes,
  };
}

function partIn(shop: ShoppersShop, partId: string): PartSummaryResponse {
  const read = shop.parts.get(partId);
  if (read === undefined) throw new Error(`The shop holds no Part ${partId}.`);
  return read.summary;
}

// Nothing is ever written: the shop is not in the database.
const aWrite: StandInAnswer = {
  ...refusal(405, 'MADE_UP_SHOP_IS_READ_ONLY'),
  refused: 'a write, which the made-up shop never takes',
};

// Any other read, of the Admin's endpoints, a Vendor's or the API's status.
const notAnswered: StandInAnswer = {
  ...refusal(404, 'NOT_FOUND'),
  refused:
    'not one of the public endpoints the Shopper app reads, which alone the stand-in answers',
};

// Answers one request from the shop: a read of one of the public endpoints
// the Shopper app reads. Every other request is refused, and says why.
export function answerFromTheStandIn(shop: ShoppersShop, call: ApiCall): StandInAnswer {
  if (call.method !== 'GET') return aWrite;
  const address = new URL(call.path, 'http://stand-in');
  const query = address.searchParams;
  const [version, first, second, ...rest] = address.pathname.split('/').filter(Boolean);
  if (version !== 'v1') return notAnswered;
  try {
    if (first === 'visible-parts' && second === undefined) return visibleParts(shop, query);
    if (second === undefined) return notAnswered;
    if (first === 'visible-parts' && second === 'filters' && rest.length === 0) {
      return filtersOfCategory(shop, query);
    }
    if (first === 'visible-parts' && rest.length === 0) return visiblePart(shop, second);
    if (first === 'photos' && rest.length === 0) return photo(shop, second);
    if (first === 'parts' && rest.length === 1 && rest[0] === 'offers') {
      return offersOfPart(shop, second, query);
    }
    if (first === 'visible-vendors' && rest.length === 0)
      return visibleVendor(shop, second);
    if (first === 'visible-vendors' && rest.length === 1 && rest[0] === 'offers') {
      return offersOfVendor(shop, second, query);
    }
  } catch (error) {
    if (error instanceof Refused) return error.answer;
    throw error;
  }
  return notAnswered;
}
