import type {
  BuildMissingSpecificationResponse,
  BuildPartInStockResponse,
  BuildPartResponse,
  BuildResponse,
  BuildVendorResponse,
  Currency,
  ErrorResponse,
  FilterKind,
  FilterResponse,
  LabelledSpecificationResponse,
  ListVisiblePartsData,
  PartSummaryResponse,
  PlatformFiguresResponse,
  ReadBuildData,
  ReadVisiblePartsFiltersData,
  ShownPriceResponse,
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
import {
  type CategoryKey,
  estimatedPowerDrawOf,
  isCompatible,
  judgeBuild,
  type MissingSpecification,
  type PartOf,
  type Build as RulesBuild,
} from '@pcp/compatibility';

import { currencies } from './currencies.ts';
import { theShopsPlatformRate } from './made-up-offers.ts';
import { daysAnOfferStaysCurrent } from './made-up-shop.ts';
import { valueAt } from './specification-document.ts';
import type {
  Category,
  CpuValue,
  ReadPart,
  ShopOffer,
  ShoppersShop,
} from './the-shoppers-shop.ts';

// The stand-in API: the answers the made-up shop gives to the public
// endpoints the Shopper app reads, as the API's description shapes them.
// It is a stand-in for looking at pages, and no test of the platform relies
// on it. It states as little of the API's rules as the shop's fixed data
// allows: it converts no price, since every price is fixed in both
// currencies, and judges no visibility, since the shop holds only Visible
// Offers of active Vendors. Two rules it must state, since no fixed data can
// carry them, as docs/agents/design-skills.md says: OFF-11's order of Offers
// (`inOff11sOrder`), which gives a Part's Lowest Price too, as its first
// Offer in stock, and BRW-1's order of a Category's Parts by it, since every
// price is fixed in both currencies and their orders can differ; and what a
// Part lacks of a specification (`lacks`), since the API labels the
// specifications of a Visible Part alone.
//
// A Build is judged by `@pcp/compatibility` itself, `judgeBuild`,
// `isCompatible` and `estimatedPowerDrawOf`, so the stand-in copies no
// Compatibility Rule, and the rules are handed the needed specifications the
// reading of the catalog left them. What no fixed data can carry it states
// plainly, each beside a comment naming the API's statement as the one that
// counts: its fixed prices added up into both price views' totals
// (`totalOf`), the second view's order (`inTheSecondViewsOrder`) and the rule
// for a Complete Build (`completenessOf`).
//
// Every answer is typed by the API client's own types, so a change to the
// API's description that the shop does not follow fails the type-check.

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

// OFF-11's order of Offers, in the currency asked: in stock first, then the
// lowest Shown Price, then the most recent Confirmation. The shop's prices
// are fixed in both currencies, and its Offers of a Part can be in one order
// in dinars and another in dollars, as its AMD Ryzen 7 7800X3D's are, so no
// order written into the shop could hold for both.
function inOff11sOrder(currency: Currency) {
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
        inOff11sOrder(currency)(a, b) ||
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

// Whether a Part holds nothing for a specification, as the API's description
// of a Part's specifications has it: no value, an empty text or list, or a
// 0 where the Category's list says 0 stands for "not known". The API labels
// a Part's specifications only for a Visible Part, and the shop's Parts are
// not visible in the development database, whose Offers they lack, so the
// stand-in labels the document the Admin's read of each gave, by the lists
// the API answers with each specification's `zeroMeansMissing`.
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
  | typeof inStockOnly
  | typeof theBuild
  | typeof keepNotCompatible
>;

// The picker's conditions on a Category's list (BLD-2, BLD-3): in stock
// only, which its filters take too; the Build, in `part`, as reading a Build
// takes it; and the switch that keeps the Parts that are not Compatible.
// Each is on only when it is `true`.
const inStockOnly = 'inStockOnly' satisfies keyof ListVisiblePartsData['query'] &
  keyof ReadVisiblePartsFiltersData['query'];
const keepNotCompatible = 'keepNotCompatible' satisfies keyof ListVisiblePartsData['query'];

function isOn(query: URLSearchParams, condition: string): boolean {
  return query.get(condition) === 'true';
}

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

// A Visible Part of the shop, as the catalog gave it and as a Category's
// list answers it.
interface VisiblePartAnswered {
  read: ReadPart;
  response: VisiblePartResponse;
}

// Every Part of a Category the shop offers, with its Lowest Price, the Shown
// Price of the first of its Offers in stock as a Part page lists them, as
// the Shopper's price slip takes it, in BRW-1's order: a Lowest Price first,
// the lowest first, then those every Vendor has out of stock, then by name.
function visiblePartsOf(
  shop: ShoppersShop,
  category: Category,
  currency: Currency,
): VisiblePartAnswered[] {
  return [...shop.parts.values()]
    .filter((read) => read.summary.category === category)
    .map((read): VisiblePartAnswered => {
      const offers = aPartsOffers(shop, read.summary.id, currency);
      const lowest = offers.find((offer) => offer.inStock);
      return {
        read,
        response: {
          ...read.summary,
          lowestPrice: lowest === undefined ? null : lowest.shownPrices[currency],
          vendorCount: offers.length,
          inStock: lowest !== undefined,
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

  const picked = visiblePartsOf(shop, category, currency).filter(({ read, response }) => {
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
      inRange &&
      (response.inStock || !isOn(query, inStockOnly))
    );
  });
  const judged = judgedForThePicker(shop, picked, query);
  const body: VisiblePartPageResponse = {
    ...aPageOf(
      query,
      judged.filter(
        ({ compatible }) => compatible !== false || isOn(query, keepNotCompatible),
      ),
    ),
    ...countOf(judged),
  };
  return answer(body);
}

// How many of the Parts judged against the Build are Compatible with it and
// how many are not, whichever way the switch is, as the API answers them;
// none without a Build.
function countOf(
  judged: readonly VisiblePartResponse[],
): Pick<VisiblePartPageResponse, 'compatibleCount' | 'notCompatibleCount'> {
  if (judged.some(({ compatible }) => compatible === undefined)) return {};
  const compatibleCount = judged.filter(({ compatible }) => compatible === true).length;
  return { compatibleCount, notCompatibleCount: judged.length - compatibleCount };
}

// The Parts listed, each judged against the Build the picker gives, when it
// gives one: each answers whether it is Compatible with it, through the
// library's `isCompatible`, which puts a Part in place of the Build's Part of
// its Category, or a kit or a drive beside the others. Those that are not
// are left out unless the switch keeps them, once counted, and before the
// list is paged, so a page counts only the Parts kept.
function judgedForThePicker(
  shop: ShoppersShop,
  listed: readonly VisiblePartAnswered[],
  query: URLSearchParams,
): VisiblePartResponse[] {
  if (!query.has(theBuild)) return listed.map(({ response }) => response);
  const build = buildForTheRules(theBuildAsked(shop, query));
  return listed.map(({ read, response }) => ({
    ...response,
    compatible: isCompatible(read.summary.category, forTheRules(read), build),
  }));
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
  const visible = visiblePartsOf(shop, category, currency).filter(
    ({ response }) => response.inStock || !isOn(query, inStockOnly),
  );
  const list = shop.categories.get(category)?.specifications ?? [];
  const filters = filtersOf[category].flatMap(({ parameter, path }): FilterResponse[] => {
    const specification = list.find((each) => each.path === path);
    const kind = specification && kindOfValue[specification.kind];
    if (specification === undefined || kind === undefined) return [];
    const values = [
      ...new Set(
        visible
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
  const prices = visible
    .map(({ response }) => response.lowestPrice)
    .filter((price) => price !== null)
    .sort((a, b) => Number(a.amount) - Number(b.amount));
  const body: VisiblePartsFiltersResponse = {
    manufacturers: [...new Set(visible.map(({ response }) => response.manufacturer))].sort(
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

// The Vendor of one of the shop's Offers, as a Part's Offers name it.
function vendorOf(shop: ShoppersShop, offer: ShopOffer) {
  const vendor = shop.vendors.find((each) => each.id === offer.vendorId);
  if (vendor === undefined) throw new Error(`The shop holds no Vendor ${offer.vendorId}.`);
  return { id: vendor.id, name: vendor.name };
}

// A Part's Offers as a Part page lists them: in OFF-11's order in the
// currency asked, then by the Vendor's name.
function aPartsOffers(shop: ShoppersShop, partId: string, currency: Currency): ShopOffer[] {
  return shop.offers
    .filter((offer) => offer.partId === partId)
    .sort(
      (a, b) =>
        inOff11sOrder(currency)(a, b) ||
        vendorOf(shop, a).name.localeCompare(vendorOf(shop, b).name) ||
        a.id.localeCompare(b.id),
    );
}

function offersOfPart(shop: ShoppersShop, partId: string, query: URLSearchParams) {
  const currency = currencyOf(query);
  if (!shop.parts.has(partId)) return partNotFound;
  const body: VisibleOfferResponse[] = aPartsOffers(shop, partId, currency).map(
    (offer) => ({ ...detailsOf(offer, currency), vendor: vendorOf(shop, offer) }),
  );
  return answer(body);
}

// The platform's figures, from the shop: every Vendor it holds, all active,
// and every Offer, all visible, since the shop holds only Visible Offers of
// active Vendors and the stand-in judges no visibility; the Platform Rate its
// prices were converted at; and the days an Offer stays current, as the
// API's description states them.
function platformFigures(shop: ShoppersShop): StandInAnswer {
  const body: PlatformFiguresResponse = {
    activeVendorCount: shop.vendors.length,
    visibleOfferCount: shop.offers.length,
    iqdPerUsd: theShopsPlatformRate,
    daysAnOfferStaysCurrent,
  };
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

// The parameter that gives a Build, as reading a Build and the picker's list
// name it.
const theBuild = 'part' satisfies keyof ReadBuildData['query'] &
  keyof ListVisiblePartsData['query'];

// The two Categories a Build holds several of, each with its quantity.
const heldWithAQuantity: readonly Category[] = ['ram', 'storage'];

// A Part of a Build: the shop's Part, and how many of it the Build holds, a
// RAM kit or a drive.
interface PartOfABuild {
  read: ReadPart;
  quantity: number | null;
}

// The Build a request gives, each value of `part` a Part's identifier,
// followed for a RAM kit or a drive by `:` and its quantity, in the
// catalog's order of Categories and then in the order given. A Part the shop
// does not offer is left out, as the API leaves out one the catalog does not
// hold. Refused, naming `part`, as the API refuses them: a value whose
// quantity is not a number, and a RAM kit or a drive with no quantity or
// another Part with one, which a cookie edited by hand can give, filing a
// kit under the CPU (`refused` in `made-up-builds.ts`). The Shopper app
// sends nothing else the API refuses, so nothing else is checked.
function theBuildAsked(shop: ShoppersShop, query: URLSearchParams): PartOfABuild[] {
  const parts = query.getAll(theBuild).flatMap((value): PartOfABuild[] => {
    const [partId, quantity, ...more] = value.split(':');
    if (more.length > 0 || (quantity !== undefined && !/^\d+$/.test(quantity))) {
      throw new Refused(notValid(theBuild));
    }
    const read = shop.parts.get(partId);
    if (read === undefined) return [];
    const withAQuantity = heldWithAQuantity.includes(read.summary.category);
    if (withAQuantity === (quantity === undefined)) throw new Refused(notValid(theBuild));
    return [{ read, quantity: withAQuantity ? Number(quantity) : null }];
  });
  return parts.sort(
    (a, b) =>
      categoriesInOrder.indexOf(a.read.summary.category) -
      categoriesInOrder.indexOf(b.read.summary.category),
  );
}

// A price in its currency's smallest unit, cents or dinars, in which every
// price of the shop is exact.
function unitsOf(price: ShownPriceResponse): number {
  return price.currency === 'USD'
    ? Math.round(Number(price.amount) * 100)
    : Number(price.amount);
}

function priceOf(
  currency: Currency,
  units: number,
  converted: boolean,
): ShownPriceResponse {
  return {
    currency,
    amount: currency === 'USD' ? (units / 100).toFixed(2) : String(units),
    converted,
  };
}

// A Shown Price times a Part's quantity, multiplied plainly, as `totalOf`
// adds up: one of a Part a Build holds one of.
function timesQuantity(price: ShownPriceResponse, quantity: number | null) {
  return priceOf(price.currency, unitsOf(price) * (quantity ?? 1), price.converted);
}

// Prices in one currency added up plainly, marked converted when any is:
// none when there is none to add. The API adds up its own in `totals.ts`,
// whose totals are the ones that count (PRC-5); the shop's prices are fixed,
// so no total written into the shop could follow a Build.
function totalOf(prices: readonly ShownPriceResponse[]): ShownPriceResponse | null {
  const [first] = prices;
  if (first === undefined) return null;
  return priceOf(
    first.currency,
    prices.reduce((total, price) => total + unitsOf(price), 0),
    prices.some((price) => price.converted),
  );
}

// A Part of a Build as the answer gives it: its summary and quantity, and
// its Lowest Price, the Shown Price of the first of its Offers in stock as a
// Part page lists them, times its quantity, with that Offer's Vendor; or
// none for an Unstocked Part. Every Part the shop offers is a Visible Part,
// and every price is shown, since the shop holds a Platform Rate.
function buildPartOf(
  shop: ShoppersShop,
  { read, quantity }: PartOfABuild,
  currency: Currency,
): BuildPartResponse {
  const lowest = aPartsOffers(shop, read.summary.id, currency).find(
    (offer) => offer.inStock,
  );
  return {
    ...read.summary,
    quantity,
    visible: true,
    unstocked: lowest === undefined,
    priceNotShown: false,
    lowestPrice:
      lowest === undefined
        ? null
        : {
            shownPrice: lowest.shownPrices[currency],
            timesQuantity: timesQuantity(lowest.shownPrices[currency], quantity),
            vendor: vendorOf(shop, lowest),
          },
  };
}

// A Part as the Compatibility Rules read it: its identifier, by which every
// outcome names it, and its needed specifications, as the reading of the
// catalog left them (`catalog-parts.ts`). The rules judge them as the
// catalog checked them, so they are typed for the rules by one cast.
function forTheRules(read: ReadPart): PartOf<CategoryKey> {
  return {
    id: read.summary.id,
    specifications: read.neededSpecifications,
  } as PartOf<CategoryKey>;
}

// A Build as the Compatibility Rules read it: each Part under its Category's
// key, and each RAM kit and drive in a list in the Build's order, with its
// quantity.
function buildForTheRules(build: readonly PartOfABuild[]): RulesBuild {
  const held: Record<string, unknown> = {};
  for (const { read, quantity } of build) {
    const key = read.summary.category;
    held[key] =
      quantity === null
        ? forTheRules(read)
        : [
            ...((held[key] as readonly unknown[] | undefined) ?? []),
            { ...forTheRules(read), quantity },
          ];
  }
  return held as RulesBuild;
}

// A needed specification a Part of the Build lacks, labelled in English as
// the API labels it, from the Part's Specification list: by its own label,
// or, for a field of a row, such as `pcie_slots.1.lanes`, by the list's and
// the field's; a path the list does not hold stands for its label.
function labelledIn(
  shop: ShoppersShop,
  build: readonly PartOfABuild[],
): (missing: MissingSpecification) => BuildMissingSpecificationResponse {
  return ({ part, path }) => {
    const read = build.find((each) => each.read.summary.id === part)?.read;
    const list = (read && shop.categories.get(read.summary.category)?.specifications) ?? [];
    const own = list.find((each) => each.path === path);
    if (own !== undefined) return { part, path, label: own.label, fieldLabel: null };

    const rows = list.find(
      (each) => each.kind === 'listOfRows' && path.startsWith(`${each.path}.`),
    );
    // After the list's path come the row's place and the field's name.
    const [, fieldName] = rows ? path.slice(rows.path.length + 1).split('.') : [];
    const field = rows?.fields?.find((each) => each.path === fieldName);
    return rows === undefined || field === undefined
      ? { part, path, label: path, fieldLabel: null }
      : { part, path, label: rows.label, fieldLabel: field.label };
  };
}

// What the Compatibility Rules find in a Build, judged by the library itself,
// passes included, in rule order, and its Estimated power draw, as the
// library adds it up, each missing specification labelled.
function judgmentOf(shop: ShoppersShop, build: readonly PartOfABuild[]) {
  const judged = buildForTheRules(build);
  const labelled = labelledIn(shop, build);
  const draw = estimatedPowerDrawOf(judged);
  return {
    outcomes: judgeBuild(judged).map((outcome): BuildResponse['outcomes'][number] =>
      outcome.outcome === 'unchecked'
        ? { ...outcome, parts: [], missing: outcome.missing.map(labelled) }
        : { ...outcome, parts: [...outcome.parts], missing: [] },
    ),
    estimatedPowerDraw:
      draw === undefined
        ? null
        : draw.known
          ? { watts: draw.watts, missing: [] }
          : { watts: null, missing: draw.missing.map(labelled) },
  };
}

// What a CPU provides in place of a Part of another Category, by the value
// that says so, and whether a value it holds provides it.
const provisions: Readonly<
  Record<CpuValue, { insteadOf: Category; provides: (value: unknown) => boolean }>
> = {
  integratedGraphics: { insteadOf: 'gpu', provides: (value) => value !== 'None' },
  includesCooler: { insteadOf: 'cpuCooler', provides: (value) => value === true },
};

// The rule for a Complete Build, as the API states it in `complete-build.ts`,
// whose rule is the one that counts (BLD-5): a CPU, a motherboard, at least
// one RAM kit, at least one drive, a case and a PSU, with a GPU unless the
// CPU has integrated graphics, held and not "None", and a CPU cooler unless
// it includes one. A CPU that does not hold either value counts as not
// providing it, and the answer says the value is not known. Without a CPU,
// the GPU and the CPU cooler are needed.
function completenessOf(build: readonly PartOfABuild[]) {
  const cpuValues = build.find((part) => part.read.summary.category === 'cpu')?.read
    .cpuValues;
  const values = Object.keys(provisions) as CpuValue[];
  const provided = values.flatMap((value) => {
    const held = cpuValues?.[value];
    return held !== undefined && provisions[value].provides(held)
      ? [provisions[value].insteadOf]
      : [];
  });
  const stillNeeded = categoriesInOrder.filter(
    (category) =>
      !provided.includes(category) &&
      !build.some((part) => part.read.summary.category === category),
  );
  return {
    complete: stillNeeded.length === 0,
    stillNeeded,
    cpuValuesNotKnown:
      cpuValues === undefined
        ? []
        : values.filter((value) => cpuValues[value] === undefined),
  };
}

// Names compared in English collation, as the API compares them.
const byName = new Intl.Collator('en').compare;

// The second price view's order, as the API states it in `price-views.ts`,
// whose order is the one that counts: the Vendors that lack the fewest Parts
// first, then the lowest total, none after any, then by name, then by
// identifier. The shop's prices are fixed in both currencies, and its
// Vendors' order can differ between them, so no order written into the shop
// could hold for both.
function inTheSecondViewsOrder(one: BuildVendorResponse, other: BuildVendorResponse) {
  const byTotal =
    one.total === null || other.total === null
      ? Number(one.total === null) - Number(other.total === null)
      : unitsOf(one.total) - unitsOf(other.total);
  return (
    one.partsLacked.length - other.partsLacked.length ||
    byTotal ||
    byName(one.name, other.name) ||
    Number(one.id > other.id) - Number(one.id < other.id)
  );
}

// The second price view (BLD-8): each Vendor with at least one of the
// Build's Parts in stock, the Parts it has so, each Shown Price times its
// quantity added up plainly into its total, and the Parts it lacks: those
// other Vendors have in stock. An Unstocked Part is in no Vendor's list.
function theSecondView(
  shop: ShoppersShop,
  build: readonly PartOfABuild[],
  currency: Currency,
): BuildVendorResponse[] {
  const inStock = (part: PartOfABuild) =>
    shop.offers.filter((offer) => offer.partId === part.read.summary.id && offer.inStock);
  const stocked = build.filter((part) => inStock(part).length > 0);
  const vendorIds = new Set(
    stocked.flatMap((part) => inStock(part).map((offer) => offer.vendorId)),
  );
  return shop.vendors
    .filter((vendor) => vendorIds.has(vendor.id))
    .map((vendor): BuildVendorResponse => {
      const partsInStock = stocked.flatMap((part): BuildPartInStockResponse[] => {
        const offer = inStock(part).find((each) => each.vendorId === vendor.id);
        if (offer === undefined) return [];
        const shownPrice = offer.shownPrices[currency];
        return [
          {
            partId: part.read.summary.id,
            shownPrice,
            timesQuantity: timesQuantity(shownPrice, part.quantity),
          },
        ];
      });
      return {
        id: vendor.id,
        name: vendor.name,
        total: totalOf(partsInStock.flatMap((has) => has.timesQuantity ?? [])),
        partsInStock,
        partsLacked: stocked
          .map((part) => part.read.summary.id)
          .filter((partId) => !partsInStock.some((has) => has.partId === partId)),
      };
    })
    .sort(inTheSecondViewsOrder);
}

// A Build, as `GET v1/build` reads it (BLD-1 to BLD-9): its Parts, whether
// it is a Complete Build, every rule's outcome, its Estimated power draw and
// both price views.
function aBuild(shop: ShoppersShop, query: URLSearchParams): StandInAnswer {
  const currency = currencyOf(query);
  const build = theBuildAsked(shop, query);
  const parts = build.map((part) => buildPartOf(shop, part, currency));
  const body: BuildResponse = {
    parts,
    ...completenessOf(build),
    ...judgmentOf(shop, build),
    // The first price view's total (BLD-7, PRC-5), leaving out each Part
    // with no Lowest Price.
    totalAcrossVendors: totalOf(
      parts.flatMap((part) => part.lowestPrice?.timesQuantity ?? []),
    ),
    vendors: theSecondView(shop, build, currency),
  };
  return answer(body);
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
    if (first === 'platform-figures' && second === undefined) return platformFigures(shop);
    if (first === 'build' && second === undefined) return aBuild(shop, query);
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
