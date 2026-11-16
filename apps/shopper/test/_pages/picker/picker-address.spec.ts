import type { VisiblePartsFiltersResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { pickerPageAddress } from '@/_pages/picker';
import { nothingOn, type PickerQuery, readPickerQuery } from '@/features/search-parts';

// A picker's query with nothing on but what a test gives, the switch off.
function aPickerQuery(on: Partial<PickerQuery>): PickerQuery {
  return { ...nothingOn, showAll: false, ...on };
}

// The query of an address, as Next hands it to a page: each parameter's
// value, or its values when it is repeated.
function queryOf(address: string): Record<string, string | string[]> {
  const read: Record<string, string | string[]> = {};
  for (const [name, value] of new URL(address, 'http://localhost').searchParams) {
    const before = read[name];
    read[name] = before === undefined ? value : [before, value].flat();
  }
  return read;
}

// What the API answers of the CPUs' filters in stock only.
const cpuFilters: VisiblePartsFiltersResponse = {
  manufacturers: ['AMD', 'Intel'],
  filters: [
    { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5', 'LGA 1700'] },
    { parameter: 'cores', kind: 'number', values: [6, 8, 16] },
  ],
  priceRange: { currency: 'IQD', lowest: '115000', highest: '755000' },
};

// The picker's address (the builder spec's The Shopper's addresses):
// `/<language>/build/<category>`, its Category written as on a Category
// page, with a Category page's query, written by the same function, and the
// switch's parameter when it shows every Part. The address holds only what
// is on.
describe("the picker's address, written from its query", () => {
  it('is the picker alone for the first page with nothing on and the switch off', () => {
    expect(pickerPageAddress('en', 'cpu', aPickerQuery({}))).toBe('/en/build/cpu');
  });

  it('holds the switch when it is on', () => {
    expect(pickerPageAddress('en', 'cpu', aPickerQuery({ showAll: true }))).toBe(
      '/en/build/cpu?show=all',
    );
  });

  it.each([
    ['ckb', '/ckb/build/cpu-cooler?search=noctua'],
    ['ar', '/ar/build/cpu-cooler?search=noctua'],
    ['en', '/en/build/cpu-cooler?search=noctua'],
  ] as const)(
    'is in the language of the page, its Category as a Category page writes it, %s',
    (language, address) => {
      expect(
        pickerPageAddress(language, 'cpuCooler', aPickerQuery({ search: 'noctua' })),
      ).toBe(address);
    },
  );

  // The order of a filled-in form, the switch kept in it after its fields,
  // and then the page.
  it('holds the search, the manufacturers, each filter, the price range, the switch and the page, in that order', () => {
    expect(
      pickerPageAddress(
        'ckb',
        'cpu',
        aPickerQuery({
          search: 'ryzen',
          manufacturers: ['AMD'],
          filters: [
            { parameter: 'socket', values: ['AM4', 'LGA 1700'] },
            { parameter: 'cores', values: [8] },
          ],
          lowest: 100_000,
          highest: 500_000,
          showAll: true,
          page: 3,
        }),
      ),
    ).toBe(
      '/ckb/build/cpu?search=ryzen&manufacturer=AMD&socket=AM4&socket=LGA+1700&cores=8&lowest=100000&highest=500000&show=all&page=3',
    );
  });

  it.each([
    aPickerQuery({ showAll: true }),
    aPickerQuery({ search: 'a&b=c+d?e#f', page: 12, showAll: true }),
    aPickerQuery({
      search: 'ryzen 7',
      manufacturers: ['AMD'],
      filters: [{ parameter: 'socket', values: ['AM5'] }],
      lowest: 0,
      highest: 755_000,
      page: 2,
    }),
  ])('writes an address that reads back as the same query, %o', (query) => {
    expect(
      readPickerQuery(queryOf(pickerPageAddress('ar', 'cpu', query)), cpuFilters),
    ).toStrictEqual(query);
  });
});
