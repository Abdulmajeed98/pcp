import { describe, expect, it } from '@jest/globals';
import type { FoundPartResponse, PartResponse } from '@pcp/api-client';

import { type CatalogReads, readTheShoppersCatalog } from '../catalog-parts.ts';
import { theOtherGpus } from '../made-up-gpus.ts';
import { namedParts, theCategoryOfManyParts } from '../made-up-offers.ts';

// A catalog of the named Parts and the other GPUs, each beside a Part whose
// name holds its name and more, and 100 more GPUs, answered as the API
// answers the Admin's searches and reads. A Part named `missing` is not
// there, the other GPUs neither without `otherGpus`, and the Part named
// `madeByTheAdmin` was made on the platform rather than imported from
// OpenDB. With `codes`, each named Part has part numbers as OpenDB writes
// some: two codes, and its own name between them.
function aCatalog({
  missing = '',
  otherGpus = true,
  madeByTheAdmin = '',
  codes = false,
} = {}) {
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
    ...(otherGpus ? theOtherGpus : []).flatMap((wanted, index) => [
      found(`other-gpu-${index}`, wanted.category, wanted.name),
      found(`longer-gpu-${index}`, wanted.category, `${wanted.name} (another one)`),
    ]),
    ...Array.from({ length: 100 }, (_, index) =>
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
      return {
        ...summary,
        openDbId: part.name === madeByTheAdmin ? null : `open-db-${partId}`,
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

  it('take the 396 other GPUs besides, each read by its Category and exact name, in their order, with its specifications', async () => {
    const { catalog } = aCatalog();
    const { others } = await readTheShoppersCatalog(catalog);

    expect(others.map((read) => read.summary.name)).toEqual(
      theOtherGpus.map((wanted) => wanted.name),
    );
    expect(others.map((read) => read.summary.id)).toEqual(
      theOtherGpus.map((_, index) => `other-gpu-${index}`),
    );
    expect(others[0].specifications).toEqual({ held: 'other-gpu-0' });
  });

  it("make the Category of many Parts 400 with the shop's own GPUs", () => {
    const own = namedParts.filter((wanted) => wanted.category === theCategoryOfManyParts);

    expect(own.length + theOtherGpus.length).toBe(400);
    expect(theOtherGpus.every((wanted) => wanted.category === theCategoryOfManyParts)).toBe(
      true,
    );
    expect(new Set(theOtherGpus.map((wanted) => wanted.name)).size).toBe(396);
    expect(
      own.some((wanted) => theOtherGpus.some(({ name }) => name === wanted.name)),
    ).toBe(false);
  });

  it('stop the command, saying which, when one of them was made on the platform', async () => {
    const { catalog } = aCatalog({ madeByTheAdmin: theOtherGpus[7].name });

    await expect(readTheShoppersCatalog(catalog)).rejects.toThrow(
      `The catalog's gpu Part named "${theOtherGpus[7].name}" was made on the platform, not imported from OpenDB, so the made-up shop cannot offer it. Change the shop's Part in apps/inspector/src/made-up-gpus.ts.`,
    );
  });

  it('stop the command, saying which, when the catalog lacks a named Part', async () => {
    const { catalog } = aCatalog({ missing: 'AMD Ryzen 5 5600' });

    await expect(readTheShoppersCatalog(catalog)).rejects.toThrow(
      'The catalog holds no cpu Part named "AMD Ryzen 5 5600"',
    );
  });

  it('stop the command, saying so, when the catalog is not imported or lacks the other GPUs', async () => {
    const { catalog } = aCatalog({ otherGpus: false });

    await expect(
      readTheShoppersCatalog({ ...catalog, search: emptyCatalog }),
    ).rejects.toThrow('The catalog holds no Parts. Import it with "pnpm catalog:import".');
    await expect(readTheShoppersCatalog(catalog)).rejects.toThrow(
      `The catalog holds no gpu Part named "${theOtherGpus[0].name}", which the made-up shop offers. Change the shop's Part in apps/inspector/src/made-up-gpus.ts.`,
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
