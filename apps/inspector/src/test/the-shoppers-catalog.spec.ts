import { describe, expect, it } from '@jest/globals';
import type { FoundPartResponse, PartResponse } from '@pcp/api-client';

import { type CatalogReads, readTheShoppersCatalog } from '../catalog-parts.ts';
import { namedParts } from '../made-up-offers.ts';

// A catalog of the named Parts and 1,000 GPUs, every tenth of them made by
// the Admin rather than imported from OpenDB, answered as the API answers
// the Admin's searches and reads. With `codes`, each named Part has part
// numbers as OpenDB writes some: two codes, and its own name between them.
function aCatalog({ missing = '', gpus = 1000, codes = false } = {}) {
  const found = (
    id: string,
    category: PartResponse['category'],
    name: string,
    partNumbers: string[] = [],
  ) =>
    ({
      id,
      category,
      name,
      manufacturer: name.split(' ')[0],
      partNumbers,
      photoPath: null,
      offerId: null,
    }) satisfies FoundPartResponse;
  const parts: FoundPartResponse[] = [
    ...namedParts
      .filter((wanted) => wanted.name !== missing)
      .flatMap((wanted, index) => [
        found(
          `named-${index}`,
          wanted.category,
          wanted.name,
          codes ? [`100-${index}WOF`, wanted.name.toUpperCase(), `100${index}WOF`] : [],
        ),
        found(`longer-${index}`, wanted.category, `${wanted.name} (another one)`),
      ]),
    ...Array.from({ length: gpus }, (_, index) =>
      found(`gpu-${index}`, 'gpu', `GPU ${String(index).padStart(4, '0')}`),
    ),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const reads: string[] = [];
  const catalog: CatalogReads = {
    async search({ category, search = '', page, size }) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      const matching = parts.filter(
        (part) =>
          part.category === category &&
          words.every((word) => part.name.toLowerCase().includes(word)),
      );
      return {
        pageNumber: page,
        pageSize: size,
        totalElements: matching.length,
        totalPages: Math.ceil(matching.length / size),
        first: page === 0,
        last: (page + 1) * size >= matching.length,
        content: matching.slice(page * size, (page + 1) * size),
      };
    },
    async part(partId) {
      reads.push(partId);
      const part = parts.find((each) => each.id === partId);
      if (part === undefined) throw new Error(`No Part ${partId}`);
      const { offerId: _, ...summary } = part;
      const madeByTheAdmin = /^gpu-\d*0$/.test(partId);
      return {
        ...summary,
        openDbId: madeByTheAdmin ? null : `open-db-${partId}`,
        specifications: { held: partId },
        missingNeededSpecifications: [],
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      };
    },
    async categories() {
      return [{ key: 'cpu', specifications: [] }];
    },
  };
  return { catalog, reads };
}

describe("the Shopper's made-up shop's Parts", () => {
  it('are read by their Category and exact name, each with its specifications', async () => {
    const { catalog } = aCatalog();
    const read = await readTheShoppersCatalog(catalog);

    expect(read.named.size).toBe(namedParts.length);
    for (const [index, wanted] of namedParts.entries()) {
      expect(read.named.get(wanted.name)).toEqual({
        summary: {
          id: `named-${index}`,
          category: wanted.category,
          name: wanted.name,
          manufacturer: wanted.name.split(' ')[0],
          partNumbers: [],
          photoPath: null,
        },
        specifications: { held: `named-${index}` },
      });
    }
    expect(read.categories).toEqual([{ key: 'cpu', specifications: [] }]);
  });

  it('hold the part numbers each has that are codes, and not its name, which OpenDB lists among the codes of some', async () => {
    const { catalog } = aCatalog({ codes: true });
    const read = await readTheShoppersCatalog(catalog);

    for (const [index, wanted] of namedParts.entries()) {
      expect(read.named.get(wanted.name)?.summary.partNumbers).toEqual([
        `100-${index}WOF`,
        `100${index}WOF`,
      ]);
    }
  });

  it('take enough GPUs besides, read in runs spread across the Category, only those imported from OpenDB', async () => {
    const { catalog, reads } = aCatalog();
    const { others } = await readTheShoppersCatalog(catalog);
    const names = others.map((read) => read.summary.name);
    const ids = others.map((read) => read.summary.id);

    expect(others.length).toBeGreaterThanOrEqual(400);
    expect(ids.filter((id) => /^gpu-\d*0$/.test(id))).toEqual([]);
    expect(ids.filter((id) => id.startsWith('named-'))).toEqual([]);
    expect(names).toContain('GPU 0001');
    expect(names.some((name) => name > 'GPU 0800')).toBe(true);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(reads.length).toBeLessThan(700);
    expect(others[0].specifications).toEqual({ held: ids[0] });
  });

  it('stop the command, saying which, when the catalog lacks a named Part', async () => {
    const { catalog } = aCatalog({ missing: 'AMD Ryzen 5 5600' });

    await expect(readTheShoppersCatalog(catalog)).rejects.toThrow(
      'The catalog holds no cpu Part named "AMD Ryzen 5 5600"',
    );
  });

  it('stop the command, saying so, when the catalog is not imported', async () => {
    const { catalog } = aCatalog({ gpus: 0 });

    await expect(
      readTheShoppersCatalog({ ...catalog, search: emptyCatalog }),
    ).rejects.toThrow('The catalog holds no Parts. Import it with "pnpm catalog:import".');
    await expect(readTheShoppersCatalog(catalog)).rejects.toThrow(
      "The catalog holds 4 other gpu Parts imported from OpenDB, too few to make 400 with the made-up shop's own.",
    );
  });
});

async function emptyCatalog({ page, size }: { page: number; size: number }) {
  return {
    pageNumber: page,
    pageSize: size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    content: [],
  };
}
