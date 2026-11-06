import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { categories, categoryAddress, categoryOfTheAddress } from '@/entities/category';

// A Category is named in the address in lower case with hyphens, and each
// name is mapped once, in the Shopper app, to the API's key for it.
const inTheAddress = [
  ['cpu', 'cpu'],
  ['cpuCooler', 'cpu-cooler'],
  ['motherboard', 'motherboard'],
  ['ram', 'ram'],
  ['storage', 'storage'],
  ['gpu', 'gpu'],
  ['case', 'case'],
  ['psu', 'psu'],
] as const;

describe("a Category's address", () => {
  it("lists the eight Categories in the catalog's order", () => {
    expect(categories).toEqual(inTheAddress.map(([category]) => category));
  });

  it.each(inTheAddress)('names %s as %s', (category, name) => {
    expect(categoryAddress('en', category)).toBe(`/en/categories/${name}`);
  });

  it.each<[Language, string]>([
    ['ckb', '/ckb/categories/cpu-cooler'],
    ['ar', '/ar/categories/cpu-cooler'],
    ['en', '/en/categories/cpu-cooler'],
  ])('is in the language of the page, %s', (language, address) => {
    expect(categoryAddress(language, 'cpuCooler')).toBe(address);
  });

  it.each(inTheAddress)('reads %s back from its name, %s', (category, name) => {
    expect(categoryOfTheAddress(name)).toBe(category);
  });

  it.each(['cpuCooler', 'CPU', 'cpu_cooler', 'monitor', ''])(
    'reads no Category from "%s"',
    (name) => {
      expect(categoryOfTheAddress(name)).toBeUndefined();
    },
  );
});
