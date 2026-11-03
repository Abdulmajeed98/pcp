import type {
  CategoryResponse,
  Currency,
  PartSummaryResponse,
  ShownPriceResponse,
  VisibleVendorResponse,
} from '@pcp/api-client';

import {
  type CatalogPart,
  type MadeUpOffer,
  type MadeUpPrices,
  namedOffers,
  partsWithAPhoto,
  theCategoryOfManyParts,
  visiblePartsOfThatCategory,
} from './made-up-offers.ts';
import {
  madeUpIdentifier,
  madeUpVendors,
  vendorsOfTheManyParts,
} from './made-up-vendors.ts';

// The made-up shop as the Shopper app sees it through the stand-in API:
// several Vendors (`made-up-vendors.ts`) and their Visible Offers
// (`made-up-offers.ts`) of real Parts of the catalog, with the Platform Rate
// of 1,575 dinars to the dollar that its prices were written at. Nothing in
// it is in the development database, and nothing is written there.
//
// It holds the worst cases a Shopper's pages are judged on: the longest Part
// names the catalog holds, one with a photo and one without; a Category
// offered by one Part, and one with 400 Visible Parts; a Part with 20 Visible
// Offers; Vendor names in Arabic script beside Latin; a Vendor with only its
// phone number, and one with no Visible Offer.

export type Category = PartSummaryResponse['category'];

// A Part the catalog answered: what a list shows of it, and its
// specifications document, as the Admin's read of a Part gives it.
export interface ReadPart {
  summary: PartSummaryResponse;
  specifications: Readonly<Record<string, unknown>>;
}

// What the command reads from the catalog when it starts: each Part the
// named Offers name, by name; the other Parts of the Category of many Parts,
// in the catalog's order; and each Category's specification list.
export interface TheShoppersCatalog {
  named: ReadonlyMap<string, ReadPart>;
  others: readonly ReadPart[];
  categories: readonly CategoryResponse[];
}

// One made-up photo for each Category, as WebP (`made-up-photos.ts`).
export type MadeUpPhotos = ReadonlyMap<Category, Buffer>;

// A Visible Offer as the shop holds it, with its Shown Price in each
// currency, fixed.
export interface ShopOffer {
  id: string;
  vendorId: string;
  partId: string;
  usdPrice: string | null;
  iqdPrice: number | null;
  shownPrices: Readonly<Record<Currency, ShownPriceResponse>>;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAt: string;
  daysSinceConfirmation: number;
}

export interface ShoppersShop {
  vendors: readonly VisibleVendorResponse[];
  // Every Part with an Offer, by its identifier.
  parts: ReadonlyMap<string, ReadPart>;
  offers: readonly ShopOffer[];
  categories: ReadonlyMap<Category, CategoryResponse>;
  // The photos' bytes, by the photo's identifier.
  photos: ReadonlyMap<string, Buffer>;
}

const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;

// The Shown Price in each currency: the Quoted Price where there is one,
// and otherwise the Converted Price written beside it.
function shownPricesOf(prices: MadeUpPrices): Record<Currency, ShownPriceResponse> {
  return {
    USD:
      'usd' in prices
        ? { currency: 'USD', amount: prices.usd, converted: false }
        : { currency: 'USD', amount: prices.usdShown, converted: true },
    IQD:
      'iqd' in prices
        ? { currency: 'IQD', amount: String(prices.iqd), converted: false }
        : { currency: 'IQD', amount: prices.iqdShown, converted: true },
  };
}

// The Offers of the other Parts of the Category of many Parts: one to three
// each, from the sixteen other shops, quoted in both currencies, at prices
// that grow with the Part's memory, a ninth of the Parts out of stock
// everywhere, and confirmed in the last thirteen days.
function offersOfAnotherPart(read: ReadPart, index: number): MadeUpOffer[] {
  const memory = read.specifications.memory;
  const gigabytes = typeof memory === 'number' && memory > 0 ? memory : 8;
  return Array.from({ length: 1 + (index % 3) }, (_, nth) => {
    const usd = 40 + 45 * gigabytes + ((index * 37) % 50) + nth * 7;
    const iqd = (60 + 71 * gigabytes + ((index * 53) % 80) + nth * 11) * 1000;
    return {
      vendor: vendorsOfTheManyParts[(index + nth * 5) % vendorsOfTheManyParts.length],
      part: read.summary,
      prices: { usd: `${usd}.00`, iqd },
      inStock: index % 9 !== 4,
      warrantyMonths: [12, 24, 36, null][(index + nth) % 4],
      confirmedAgo: {
        days: (index * 5 + nth * 3) % 14,
        hours: (index * 7 + nth * 11) % 12,
      },
    };
  });
}

function keyOf(part: CatalogPart): string {
  return `${part.category} ${part.name}`;
}

// The shop at `now`, its Offers confirmed that long before it, with the
// Parts the catalog gave and a made-up photo for some of them.
export function theShoppersShop(
  now: Date,
  catalog: TheShoppersCatalog,
  photos: MadeUpPhotos,
): ShoppersShop {
  const readOf = (wanted: CatalogPart): ReadPart => {
    const read = catalog.named.get(wanted.name);
    if (read === undefined) {
      throw new Error(`The catalog gave no Part named "${wanted.name}".`);
    }
    return read;
  };

  // The Category of many Parts: its named Parts, and enough of the catalog's
  // others to make 400.
  const namedOfThatCategory = new Set(
    namedOffers
      .filter((offer) => offer.part.category === theCategoryOfManyParts)
      .map((offer) => readOf(offer.part).summary.id),
  );
  const others = catalog.others
    .filter((read) => !namedOfThatCategory.has(read.summary.id))
    .slice(0, visiblePartsOfThatCategory - namedOfThatCategory.size);
  if (others.length + namedOfThatCategory.size < visiblePartsOfThatCategory) {
    throw new Error(
      `The catalog gave ${others.length} other ${theCategoryOfManyParts} Parts, too few to make ${visiblePartsOfThatCategory}.`,
    );
  }

  // The photos: the named Parts', and every third of the others'.
  const withAPhoto = new Set(partsWithAPhoto.map(keyOf));
  const photoBytes = new Map<string, Buffer>();
  const withItsPhoto = (read: ReadPart, hasOne: boolean): ReadPart => {
    if (!hasOne) return read;
    const bytes = photos.get(read.summary.category);
    if (bytes === undefined)
      throw new Error(`No made-up photo of a ${read.summary.category}.`);
    const photoId = madeUpIdentifier(500001 + photoBytes.size);
    photoBytes.set(photoId, bytes);
    return { ...read, summary: { ...read.summary, photoPath: `/v1/photos/${photoId}` } };
  };

  const parts = new Map<string, ReadPart>();
  for (const offer of namedOffers) {
    const read = readOf(offer.part);
    if (!parts.has(read.summary.id)) {
      parts.set(read.summary.id, withItsPhoto(read, withAPhoto.has(keyOf(offer.part))));
    }
  }
  others.forEach((read, index) => {
    parts.set(read.summary.id, withItsPhoto(read, index % 3 === 0));
  });

  const madeUp = [
    ...namedOffers.map((offer, index) => ({
      offer,
      // The first Vendor's keep the identifiers the dashboard's shop gives.
      id: madeUpIdentifier(offer.vendor === 1 ? 101 + index : 1001 + index),
      partId: readOf(offer.part).summary.id,
    })),
    ...others.flatMap((read, index) =>
      offersOfAnotherPart(read, index).map((offer, nth) => ({
        offer,
        id: madeUpIdentifier(100001 + index * 10 + nth),
        partId: read.summary.id,
      })),
    ),
  ];
  const offers = madeUp.map(({ offer, id, partId }): ShopOffer => {
    const ago = offer.confirmedAgo.days * aDay + offer.confirmedAgo.hours * anHour;
    return {
      id,
      vendorId: madeUpIdentifier(offer.vendor),
      partId,
      usdPrice: 'usd' in offer.prices ? offer.prices.usd : null,
      iqdPrice: 'iqd' in offer.prices ? offer.prices.iqd : null,
      shownPrices: shownPricesOf(offer.prices),
      inStock: offer.inStock,
      warrantyMonths: offer.warrantyMonths,
      confirmedAt: new Date(now.getTime() - ago).toISOString(),
      daysSinceConfirmation: Math.floor(ago / aDay),
    };
  });

  return {
    vendors: madeUpVendors,
    parts,
    offers,
    categories: new Map(catalog.categories.map((category) => [category.key, category])),
    photos: photoBytes,
  };
}
