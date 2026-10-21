import type { FoundPartResponse, PartSummaryResponse } from '@pcp/api-client';

import { type CatalogPart, partsTheShopOffers } from './made-up-shop.ts';

// A search of the catalog for the Parts of one Category whose names hold
// every word of `search`, as the API answers it.
export type SearchOfTheCatalog = (
  query: CatalogPart & { search: string },
) => Promise<readonly FoundPartResponse[]>;

// The real Parts the made-up shop offers, read from the catalog by their
// Category and exact name (ADR-0001: no Part is invented). A name the
// catalog does not hold once and once only stops the command, and says which.
export async function partsOfTheCatalog(
  searchTheCatalog: SearchOfTheCatalog,
): Promise<Map<string, PartSummaryResponse>> {
  const parts = await Promise.all(
    partsTheShopOffers.map(async (wanted): Promise<[string, PartSummaryResponse]> => {
      const answer = await searchTheCatalog({ ...wanted, search: wanted.name });
      const named = answer.filter(
        (part) => part.name === wanted.name && part.category === wanted.category,
      );
      if (named.length !== 1) {
        const howMany = named.length === 0 ? 'no' : String(named.length);
        throw new Error(
          `The catalog holds ${howMany} ${wanted.category} Part${named.length > 1 ? 's' : ''} named "${wanted.name}", which the made-up shop offers. Change the shop's Part in apps/inspector/src/made-up-shop.ts.`,
        );
      }
      const { id, category, name, manufacturer, partNumbers, photoPath } = named[0];
      return [name, { id, category, name, manufacturer, partNumbers, photoPath }];
    }),
  );
  return new Map(parts);
}
