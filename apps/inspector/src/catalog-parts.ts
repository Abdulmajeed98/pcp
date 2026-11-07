import type {
  CategoryResponse,
  FoundPartResponse,
  PartPageResponse,
  PartResponse,
  PartSummaryResponse,
} from '@pcp/api-client';

import { theOtherGpus } from './made-up-gpus.ts';
import { type CatalogPart, namedParts, theCategoryOfManyParts } from './made-up-offers.ts';
import { partsTheShopOffers } from './made-up-shop.ts';
import type { ReadPart, TheShoppersCatalog } from './the-shoppers-shop.ts';

// A search of the catalog for the Parts of one Category whose names hold
// every word of `search`, as the API answers it.
export type SearchOfTheCatalog = (
  query: CatalogPart & { search: string },
) => Promise<readonly FoundPartResponse[]>;

// The real Parts the made-up shop offers, read from the catalog by their
// Category and exact name (ADR-0001: no Part is invented). A name the
// catalog does not hold once and once only stops the command, and says which
// and in which of the shop's files, `file`. The dashboard's shop reads its
// own Vendor's Parts, and the Shopper's every Part it offers.
export async function partsOfTheCatalog(
  searchTheCatalog: SearchOfTheCatalog,
  wanted: readonly CatalogPart[] = partsTheShopOffers,
  file = 'made-up-offers.ts',
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
          `The catalog holds ${howMany} ${each.category} Part${named.length > 1 ? 's' : ''} named "${each.name}", which the made-up shop offers. Change the shop's Part in apps/inspector/src/${file}.`,
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

// Real Parts of the catalog, each read by its Category and exact name, with
// its specifications, in the order they are wanted. A name the catalog does
// not hold once, and a Part made on the platform rather than imported from
// OpenDB, which is not a real Part (ADR-0001), stop the command and say
// which, and in which file of the shop to change it.
async function readEachOf(
  catalog: CatalogReads,
  wanted: readonly CatalogPart[],
  file: string,
): Promise<ReadPart[]> {
  const found = await partsOfTheCatalog(
    async ({ category, search }) =>
      (await catalog.search({ category, search, page: 0, size: 50 })).content,
    wanted,
    file,
  );
  return aFewAtATime(
    wanted.map((each) => found.get(each.name)),
    async (summary) => {
      if (summary === undefined) throw new Error('A wanted Part was not found.');
      const part = await catalog.part(summary.id);
      if (part.openDbId === null) {
        throw new Error(
          `The catalog's ${summary.category} Part named "${summary.name}" was made on the platform, not imported from OpenDB, so the made-up shop cannot offer it. Change the shop's Part in apps/inspector/src/${file}.`,
        );
      }
      return heldAs(part);
    },
  );
}

// What the Shopper's made-up shop reads from the catalog when the command
// starts: each named Part, and the 396 other GPUs that make the Category of
// many Parts, each by its Category and exact name, with its specifications;
// and the Categories' specification lists.
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
  const named = await readEachOf(catalog, namedParts, 'made-up-offers.ts');
  const others = await readEachOf(catalog, theOtherGpus, 'made-up-gpus.ts');

  return {
    named: new Map(named.map((read) => [read.summary.name, read])),
    others,
    categories,
  };
}
