import { describe, expect, it } from '@jest/globals';
import type { FoundPartResponse } from '@pcp/api-client';

import { partsOfTheCatalog, type SearchOfTheCatalog } from '../catalog-parts.ts';
import { madeUpShop, partsTheShopOffers } from '../made-up-shop.ts';
import { catalogPartsOfTheShop, now } from './catalog-stand-in.ts';

function found(name: string, category: FoundPartResponse['category'], id: string) {
  return {
    id,
    category,
    name,
    manufacturer: 'From the catalog',
    partNumbers: [],
    photoPath: null,
    offerId: null,
  } satisfies FoundPartResponse;
}

// A catalog that holds each Part the shop offers, beside others whose names
// hold the same words, and answers a search with all of them.
const catalogWithEveryPart: SearchOfTheCatalog = async ({ category, search }) => [
  found(`${search} (another one)`, category, 'another'),
  found(search, category, `part ${search}`),
];

describe("the made-up shop's Parts", () => {
  it("are the catalog's Parts of the exact names and Categories it offers", async () => {
    const parts = await partsOfTheCatalog(catalogWithEveryPart);

    for (const wanted of partsTheShopOffers) {
      expect(parts.get(wanted.name)).toEqual({
        id: `part ${wanted.name}`,
        category: wanted.category,
        name: wanted.name,
        manufacturer: 'From the catalog',
        partNumbers: [],
        photoPath: null,
      });
    }
  });

  it('are what its Offers name', () => {
    const parts = catalogPartsOfTheShop();
    const shop = madeUpShop(now, parts);

    expect(shop.offers.map((offer) => offer.part)).toEqual(
      partsTheShopOffers.map((wanted) => parts.get(wanted.name)),
    );
  });

  it('stop the command when the catalog holds no Part of a name, and say which', async () => {
    const missing = partsTheShopOffers[3];
    const catalogWithoutOne: SearchOfTheCatalog = async (query) =>
      query.search === missing.name ? [] : catalogWithEveryPart(query);

    await expect(partsOfTheCatalog(catalogWithoutOne)).rejects.toThrow(
      `The catalog holds no ${missing.category} Part named "${missing.name}"`,
    );
  });

  it('stop the command when the catalog holds two Parts of a name', async () => {
    const twice = partsTheShopOffers[0];
    const catalogWithTwo: SearchOfTheCatalog = async (query) =>
      query.search === twice.name
        ? [
            found(twice.name, twice.category, 'one'),
            found(twice.name, twice.category, 'two'),
          ]
        : catalogWithEveryPart(query);

    await expect(partsOfTheCatalog(catalogWithTwo)).rejects.toThrow(
      `The catalog holds 2 ${twice.category} Parts named "${twice.name}"`,
    );
  });
});
