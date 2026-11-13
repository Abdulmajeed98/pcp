import type { VisiblePartsFiltersResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import {
  allCleared,
  type CategoryQuery,
  choicesOn,
  fieldsTheFormKeeps,
  nothingOn,
  type PickerQuery,
  readCategoryQuery,
  readPickerQuery,
  switchedTo,
} from '@/features/search-parts';

// A picker's query with nothing on but what a test gives, the switch off.
function aPickerQuery(on: Partial<PickerQuery>): PickerQuery {
  return { ...nothingOn, showAll: false, ...on };
}

// A Category page's query with nothing on but what a test gives.
function aQuery(on: Partial<CategoryQuery>): CategoryQuery {
  return { ...nothingOn, ...on };
}

// What the API answers of the CPUs' filters in stock only: the
// manufacturers, each filter with the values the Parts in stock hold, and
// the range of their Lowest Prices, in dinars.
const cpuFilters: VisiblePartsFiltersResponse = {
  manufacturers: ['AMD', 'Intel'],
  filters: [
    { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5', 'LGA 1700'] },
    { parameter: 'cores', kind: 'number', values: [6, 8, 16] },
  ],
  priceRange: { currency: 'IQD', lowest: '115000', highest: '755000' },
};

// The picker's query is a Category page's query, read by the same function,
// with one more parameter for the switch (the builder spec's The Shopper's
// addresses): `show=all`, which shows every Part in stock, those that do not
// are not Compatible with the Build among them. The address holds only what is on, so the
// switch off is no parameter at all.
describe("the picker's query, read from its address", () => {
  it('reads the switch on', () => {
    expect(readPickerQuery({ show: 'all' }, cpuFilters)).toStrictEqual(
      aPickerQuery({ showAll: true }),
    );
  });

  it('reads the switch off when the address does not hold it', () => {
    expect(readPickerQuery({}, cpuFilters)).toStrictEqual(aPickerQuery({}));
  });

  it.each(['ALL', 'All', 'true', '1', 'yes', '', ' all'])(
    'reads the switch off when it is written %j, as no address the picker writes',
    (written) => {
      expect(readPickerQuery({ show: written }, cpuFilters).showAll).toBe(false);
    },
  );

  it('reads the first of a repeated switch', () => {
    expect(readPickerQuery({ show: ['all', 'some'] }, cpuFilters).showAll).toBe(true);
    expect(readPickerQuery({ show: ['some', 'all'] }, cpuFilters).showAll).toBe(false);
  });

  // The rest is a Category page's query: the search, the manufacturers, the
  // filters, the price range and the page, read against what the filters in
  // stock offer, and nothing else.
  it("reads the search, the filters, the price range and the page as a Category page's", () => {
    expect(
      readPickerQuery(
        {
          search: ' ryzen  ٧ ',
          manufacturer: 'AMD',
          socket: ['AM5', 'AM3'],
          lowest: '100٬000',
          page: '2',
          show: 'all',
          size: '100',
        },
        cpuFilters,
      ),
    ).toStrictEqual(
      aPickerQuery({
        search: 'ryzen 7',
        manufacturers: ['AMD'],
        filters: [{ parameter: 'socket', values: ['AM5'] }],
        lowest: 100_000,
        page: 2,
        showAll: true,
      }),
    );
  });

  // Without the answer of the filters, a Category page reads only its
  // search and its page; the switch is the picker's own, and is read too.
  it('reads the switch without the answer of the filters', () => {
    expect(readPickerQuery({ search: 'ryzen', socket: 'AM5', show: 'all' })).toStrictEqual(
      aPickerQuery({ search: 'ryzen', showAll: true }),
    );
  });
});

// A Category page has no switch, so its query is read as it was before the
// picker, and an address with the switch in it opens the same list.
describe("a Category page's query, left as it was", () => {
  it('ignores the switch', () => {
    expect(readCategoryQuery({ search: 'ryzen', show: 'all' }, cpuFilters)).toStrictEqual(
      aQuery({ search: 'ryzen' }),
    );
  });
});

// The switch, a link to the same picker with or without the Parts that do
// are not Compatible (DESIGN.md's The switch): the list it leads to starts again at its
// first page, as a new choice does, and keeps every choice that is on.
describe("the picker's switch", () => {
  const searched = aPickerQuery({
    search: 'ryzen',
    filters: [{ parameter: 'socket', values: ['AM5'] }],
    page: 3,
  });

  it('turns on, from the first page, keeping the choices that are on', () => {
    expect(switchedTo(searched, true)).toStrictEqual({
      ...searched,
      showAll: true,
      page: 1,
    });
  });

  it('turns off, from the first page, keeping the choices that are on', () => {
    expect(switchedTo({ ...searched, showAll: true }, false)).toStrictEqual({
      ...searched,
      page: 1,
    });
  });
});

// The choices that are on are the search, the manufacturers, the filters
// and the price range. The switch is not one of them: it stands in the
// sheet as a control of its own, and clearing a choice, or all of them,
// leaves it as it is.
describe("the picker's choices that are on, and clearing them", () => {
  const everything = aPickerQuery({
    search: 'ryzen',
    manufacturers: ['AMD'],
    filters: [{ parameter: 'socket', values: ['AM5'] }],
    lowest: 100_000,
    page: 2,
    showAll: true,
  });

  it('does not list the switch as a choice that is on', () => {
    expect(choicesOn(aPickerQuery({ showAll: true }))).toEqual([]);
    expect(choicesOn(everything).map(({ kind }) => kind)).toEqual([
      'search',
      'manufacturer',
      'filter',
      'price',
    ]);
  });

  it('keeps the switch when one choice is cleared, from the first page', () => {
    expect(choicesOn(everything)[0]?.without).toStrictEqual({
      ...everything,
      search: '',
      page: 1,
    });
  });

  it('keeps the switch when every choice is cleared', () => {
    expect(allCleared(everything)).toStrictEqual(aPickerQuery({ showAll: true }));
    expect(allCleared({ ...everything, showAll: false })).toStrictEqual(aPickerQuery({}));
  });

  it("clears a Category page's choices to nothing on", () => {
    expect(allCleared(aQuery({ search: 'ryzen', page: 4 }))).toStrictEqual(nothingOn);
  });
});

// The search and the filters are one form sent with GET, which works before
// any script has loaded; in the picker it keeps the switch as it is, in a
// field of its own that the Shopper does not fill in, so that a search with
// the switch on still shows every Part.
describe("the fields the picker's form keeps", () => {
  it('keeps the switch when it is on', () => {
    expect(fieldsTheFormKeeps(aPickerQuery({ showAll: true }))).toEqual([['show', 'all']]);
  });

  it('keeps nothing when it is off, nor on a Category page', () => {
    expect(fieldsTheFormKeeps(aPickerQuery({}))).toEqual([]);
    expect(fieldsTheFormKeeps(aQuery({ search: 'ryzen' }))).toEqual([]);
  });
});
