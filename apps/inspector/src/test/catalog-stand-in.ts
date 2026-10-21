import type { PartSummaryResponse } from '@pcp/api-client';

import { madeUpShop, type MadeUpShop, partsTheShopOffers } from '../made-up-shop.ts';

// The moment the tests take for now: noon in Erbil on 21 October 2026.
export const now = new Date('2026-10-21T09:00:00.000Z');

// A stand-in for the catalog's answer about each Part the shop offers: the
// Part with that name and Category, with an identifier the catalog would not
// give, so that a test can tell where an Offer's Part came from.
export function catalogPartsOfTheShop(): Map<string, PartSummaryResponse> {
  return new Map(
    partsTheShopOffers.map((wanted, index) => [
      wanted.name,
      {
        id: `catalog-part-${index}`,
        category: wanted.category,
        name: wanted.name,
        manufacturer: 'From the catalog',
        partNumbers: [`CATALOG-${index}`],
        photoPath: null,
      },
    ]),
  );
}

export function aShopFromTheCatalog(): MadeUpShop {
  return madeUpShop(now, catalogPartsOfTheShop());
}
