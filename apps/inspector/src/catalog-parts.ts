import type {
  CategoryResponse,
  FoundPartResponse,
  PartPageResponse,
  PartResponse,
  PartSummaryResponse,
} from '@pcp/api-client';

import {
  type CatalogPart,
  namedParts,
  theCategoryOfManyParts,
  visiblePartsOfThatCategory,
} from './made-up-offers.ts';
import { partsTheShopOffers } from './made-up-shop.ts';
import type { ReadPart, TheShoppersCatalog } from './the-shoppers-shop.ts';

// A search of the catalog for the Parts of one Category whose names hold
// every word of `search`, as the API answers it.
export type SearchOfTheCatalog = (
  query: CatalogPart & { search: string },
) => Promise<readonly FoundPartResponse[]>;

// The real Parts the made-up shop offers, read from the catalog by their
// Category and exact name (ADR-0001: no Part is invented). A name the
// catalog does not hold once and once only stops the command, and says which.
// The dashboard's shop reads its own Vendor's Parts, and the Shopper's every
// named Part.
export async function partsOfTheCatalog(
  searchTheCatalog: SearchOfTheCatalog,
  wanted: readonly CatalogPart[] = partsTheShopOffers,
): Promise<Map<string, PartSummaryResponse>> {
  const parts = await Promise.all(
    wanted.map(async (each): Promise<[string, PartSummaryResponse]> => {
      const answer = await searchTheCatalog({ ...each, search: each.name });
      const named = answer.filter(
        (part) => part.name === each.name && part.category === each.category,
      );
      if (named.length !== 1) {
        const howMany = named.length === 0 ? 'no' : String(named.length);
        throw new Error(
          `The catalog holds ${howMany} ${each.category} Part${named.length > 1 ? 's' : ''} named "${each.name}", which the made-up shop offers. Change the shop's Part in apps/inspector/src/made-up-offers.ts.`,
        );
      }
      const { id, category, name, manufacturer, partNumbers, photoPath } = named[0];
      return [name, { id, category, name, manufacturer, partNumbers, photoPath }];
    }),
  );
  return new Map(parts);
}

// The reads of the catalog the Shopper's command makes as the development
// Admin: a page of a search, one Part with its specifications, and the
// Categories' specification lists.
export interface CatalogReads {
  search(query: {
    category: CatalogPart['category'];
    search?: string;
    page: number;
    size: number;
  }): Promise<PartPageResponse>;
  part(partId: string): Promise<PartResponse>;
  categories(): Promise<CategoryResponse[]>;
}

// The largest page the catalog's search answers, and how many runs of it are
// read across the Category of many Parts, so that its manufacturers and
// specifications vary as the whole catalog's do.
const largestPage = 100;
const runs = 5;

// Runs `work` on each item, a few at a time, in the items' order.
async function aFewAtATime<Item, Result>(
  items: readonly Item[],
  work: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = [];
  for (let start = 0; start < items.length; start += 10) {
    results.push(...(await Promise.all(items.slice(start, start + 10).map(work))));
  }
  return results;
}

// Whether a part number is a code, one word as a box prints it, and not a
// name: OpenDB lists a Part's own name among the codes of some, such as "AMD
// Ryzen 7 7800X3D" beside 100-100000910WOF.
function isACode(partNumber: string): boolean {
  return /^\S+$/.test(partNumber);
}

// A Part as the shop holds it: what a list shows of it, without the photo
// the development database may hold for it, since the shop serves only its
// own made-up photos, and with only the part numbers that are codes, so that
// a Part page shows plain codes; and its specifications.
function heldAs(part: PartResponse): ReadPart {
  const { id, category, name, manufacturer, partNumbers, specifications } = part;
  return {
    summary: {
      id,
      category,
      name,
      manufacturer,
      partNumbers: partNumbers.filter(isACode),
      photoPath: null,
    },
    specifications,
  };
}

// What the Shopper's made-up shop reads from the catalog when the command
// starts: each named Part by its Category and exact name, each with its
// specifications; other Parts of the Category of many Parts, read in runs
// spread across the whole Category and kept only when imported from OpenDB,
// since a Part the Admin or a test made is not a real Part (ADR-0001); and
// the Categories' specification lists.
export async function readTheShoppersCatalog(
  catalog: CatalogReads,
): Promise<TheShoppersCatalog> {
  const first = await catalog.search({
    category: theCategoryOfManyParts,
    page: 0,
    size: 1,
  });
  if (first.totalElements === 0) {
    throw new Error('The catalog holds no Parts. Import it with "pnpm catalog:import".');
  }
  const categories = await catalog.categories();
  const found = await partsOfTheCatalog(
    async ({ category, search }) =>
      (await catalog.search({ category, search, page: 0, size: 50 })).content,
    namedParts,
  );
  const named = await aFewAtATime([...found.values()], async (summary) => {
    const part = await catalog.part(summary.id);
    if (part.openDbId === null) {
      throw new Error(
        `The catalog's ${summary.category} Part named "${summary.name}" was made on the platform, not imported from OpenDB, so the made-up shop cannot offer it. Change the shop's Part in apps/inspector/src/made-up-offers.ts.`,
      );
    }
    return heldAs(part);
  });

  // Runs of the largest page, at pages spread evenly across the Category.
  const pages = Math.ceil(first.totalElements / largestPage);
  const runPages = [
    ...new Set(Array.from({ length: runs }, (_, run) => Math.floor((run * pages) / runs))),
  ];
  const namedIds = new Set(named.map((read) => read.summary.id));
  const candidates = (
    await aFewAtATime(runPages, async (page) =>
      (
        await catalog.search({ category: theCategoryOfManyParts, page, size: largestPage })
      ).content.filter((part) => !namedIds.has(part.id)),
    )
  ).flat();
  const others = (await aFewAtATime(candidates, (part) => catalog.part(part.id)))
    .filter((part) => part.openDbId !== null)
    .map(heldAs);
  const ownOfThatCategory = named.filter(
    (read) => read.summary.category === theCategoryOfManyParts,
  ).length;
  if (others.length + ownOfThatCategory < visiblePartsOfThatCategory) {
    throw new Error(
      `The catalog holds ${others.length} other ${theCategoryOfManyParts} Parts imported from OpenDB, too few to make ${visiblePartsOfThatCategory} with the made-up shop's own.`,
    );
  }

  return {
    named: new Map(named.map((read) => [read.summary.name, read])),
    others,
    categories,
  };
}
