import type { VisiblePartsFiltersResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import {
  addressOfTheForm,
  type CategoryQuery,
  categoryPageAddress,
  choicesOn,
  nothingOn,
  readCategoryQuery,
  readPriceRange,
} from '@/features/search-parts';

// A query with nothing on but what a test gives.
function aQuery(on: Partial<CategoryQuery>): CategoryQuery {
  return { ...nothingOn, ...on };
}

// What the API answers of a CPU's filters (`GET v1/visible-parts/filters`):
// the manufacturers, each filter with the values its Visible Parts hold,
// numbers by size and text alphabetically, and the range of their Lowest
// Prices, in dinars.
const cpuFilters: VisiblePartsFiltersResponse = {
  manufacturers: ['AMD', 'Intel'],
  filters: [
    { parameter: 'socket', kind: 'text', values: ['AM4', 'AM5', 'LGA 1700'] },
    { parameter: 'cores', kind: 'number', values: [6, 8, 16] },
  ],
  priceRange: { currency: 'IQD', lowest: '115000', highest: '755000' },
};

// A CPU cooler's, with a yes-or-no filter, "Air or liquid", and a number with
// its unit, in dollars.
const coolerFilters: VisiblePartsFiltersResponse = {
  manufacturers: ['Arctic', 'Noctua'],
  filters: [
    { parameter: 'waterCooled', kind: 'yesNo', values: [false, true] },
    { parameter: 'radiatorSize', kind: 'number', unit: 'mm', values: [240, 360] },
  ],
  priceRange: { currency: 'USD', lowest: '29.99', highest: '189.00' },
};

// A Category whose Visible Parts are all out of stock at every Vendor: none
// has a Lowest Price, so there is no range to choose from.
const noPrices: VisiblePartsFiltersResponse = {
  ...cpuFilters,
  priceRange: { currency: 'IQD', lowest: null, highest: null },
};

// A Category page's query, as the address holds it (the browse spec's The
// Shopper's addresses): the search and the page, which a Shopper can reload,
// link and share. Anything else in the address is ignored.
describe("a Category page's query, read from its address", () => {
  it('reads the search', () => {
    expect(readCategoryQuery({ search: 'ryzen 7600' }).search).toBe('ryzen 7600');
  });

  // A Kurdish or an Arabic keyboard types Arabic-Indic digits, and every
  // Part's name, manufacturer and part number is written in Western ones
  // (LANG-3), so a search for "٤٠٧٠" is a search for "4070".
  it.each([
    ['Arabic-Indic', 'rtx ٤٠٧٠', 'rtx 4070'],
    ['Eastern Arabic-Indic', 'rtx ۴۰۷۰', 'rtx 4070'],
  ])('reads %s digits in the search as Western ones', (_digits, typed, read) => {
    expect(readCategoryQuery({ search: typed }).search).toBe(read);
  });

  // The API finds every word in any order, so the spaces between them are
  // only where one ends and the next begins.
  it('reads the words of the search without the spaces around and between them', () => {
    expect(readCategoryQuery({ search: '  rtx   4070 ' }).search).toBe('rtx 4070');
  });

  // A page with no search lists every Visible Part of its Category, and says
  // so differently from a search that found nothing.
  it.each([
    ['no search', {}],
    ['an empty search', { search: '' }],
    ['a search of spaces alone', { search: '   ' }],
  ])('reads %s as no search', (_case, query) => {
    expect(readCategoryQuery(query).search).toBe('');
  });

  it('reads the first search of an address that repeats it', () => {
    expect(readCategoryQuery({ search: ['ryzen', 'core'] }).search).toBe('ryzen');
  });

  // The page is counted from 1 in the address, as "Page 2 of 17" counts it.
  it.each([
    ['2', 2],
    ['17', 17],
    ['007', 7],
  ])('reads the page %s as page %i', (page, read) => {
    expect(readCategoryQuery({ page }).page).toBe(read);
  });

  it('reads an address with no page as the first page', () => {
    expect(readCategoryQuery({}).page).toBe(1);
  });

  it.each([
    ['Arabic-Indic', '١٢', 12],
    ['Eastern Arabic-Indic', '۱۲', 12],
  ])('reads a page in %s digits', (_digits, page, read) => {
    expect(readCategoryQuery({ page }).page).toBe(read);
  });

  // An old link, a typing slip or an address made by hand still opens the
  // list, at its first page.
  it.each(['0', '-2', '2.5', '1e3', '+2', 'two', '', ' '])(
    'reads the page "%s", which is not a whole number from 1, as the first page',
    (page) => {
      expect(readCategoryQuery({ page }).page).toBe(1);
    },
  );

  it('reads the first page of an address that repeats it', () => {
    expect(readCategoryQuery({ page: ['3', '5'] }).page).toBe(3);
  });

  // The API pages a list to its page 1,000,000, counted from 0, and no list
  // has that many pages, so a page past it is past the last page of any list
  // and is read as that one.
  it('reads a page past the last the API pages to as that last, past every list', () => {
    expect(readCategoryQuery({ page: '99999999999999999999' }).page).toBe(1_000_001);
    expect(readCategoryQuery({ page: '1000002' }).page).toBe(1_000_001);
    expect(readCategoryQuery({ page: '1000001' }).page).toBe(1_000_001);
  });

  // Nothing but the search, the filters the Category offers, the price range
  // and the page is read: every other parameter, a page size among them, is
  // ignored.
  it('ignores every other parameter', () => {
    expect(
      readCategoryQuery(
        { search: 'ryzen', page: '2', size: '100', sort: 'name', x: ['1'] },
        cpuFilters,
      ),
    ).toEqual(aQuery({ search: 'ryzen', page: 2 }));
  });
});

// The filters the address holds, read against the API's answer of the
// Category's filters (the browse spec's The Shopper's addresses): a filter
// with several values repeats its parameter, and a parameter or a value the
// Category's filters do not offer is dropped, never sent to the API, so that
// an old link still opens.
describe("a Category page's filters, read from its address", () => {
  it('reads a value a filter offers', () => {
    expect(readCategoryQuery({ socket: 'AM5' }, cpuFilters).filters).toEqual([
      { parameter: 'socket', values: ['AM5'] },
    ]);
  });

  // Several values of one filter find a Part that holds any of them.
  it('reads several values of one filter, from its repeated parameter, in the order the filter offers them', () => {
    expect(readCategoryQuery({ socket: ['LGA 1700', 'AM4'] }, cpuFilters).filters).toEqual([
      { parameter: 'socket', values: ['AM4', 'LGA 1700'] },
    ]);
  });

  // Different filters must all match.
  it('reads the values of different filters, in the order the Category offers its filters', () => {
    expect(readCategoryQuery({ cores: '8', socket: 'AM5' }, cpuFilters).filters).toEqual([
      { parameter: 'socket', values: ['AM5'] },
      { parameter: 'cores', values: [8] },
    ]);
  });

  it.each([
    ['Western', '16'],
    ['Arabic-Indic', '١٦'],
    ['Eastern Arabic-Indic', '۱۶'],
  ])('reads a number in %s digits as the number', (_digits, typed) => {
    expect(readCategoryQuery({ cores: typed }, cpuFilters).filters).toEqual([
      { parameter: 'cores', values: [16] },
    ]);
  });

  it('reads yes or no as true or false', () => {
    expect(readCategoryQuery({ waterCooled: 'true' }, coolerFilters).filters).toEqual([
      { parameter: 'waterCooled', values: [true] },
    ]);
    expect(
      readCategoryQuery({ waterCooled: ['true', 'false'] }, coolerFilters).filters,
    ).toEqual([{ parameter: 'waterCooled', values: [false, true] }]);
  });

  it('reads the manufacturers the Category offers, in the order it offers them', () => {
    expect(
      readCategoryQuery({ manufacturer: ['Intel', 'AMD'] }, cpuFilters).manufacturers,
    ).toEqual(['AMD', 'Intel']);
  });

  it('reads a value once, however often the address repeats it', () => {
    const read = readCategoryQuery(
      { socket: ['AM5', 'AM5'], manufacturer: ['AMD', 'AMD'] },
      cpuFilters,
    );
    expect(read.filters).toEqual([{ parameter: 'socket', values: ['AM5'] }]);
    expect(read.manufacturers).toEqual(['AMD']);
  });

  // A filter of another Category, or none at all, as an old link or a
  // mistyped one may hold.
  it("drops a parameter the Category's filters do not offer", () => {
    expect(
      readCategoryQuery(
        { chipset: 'RTX 4070', colour: 'red', waterCooled: 'true' },
        cpuFilters,
      ).filters,
    ).toEqual([]);
  });

  it('drops a value its filter does not offer, and keeps the values it does', () => {
    expect(
      readCategoryQuery(
        { socket: ['AM5', 'Moon', 'am5'], cores: ['8', '99', 'eight', '8.0', ''] },
        cpuFilters,
      ).filters,
    ).toEqual([
      { parameter: 'socket', values: ['AM5'] },
      { parameter: 'cores', values: [8] },
    ]);
  });

  it('drops yes or no written any other way', () => {
    expect(
      readCategoryQuery({ waterCooled: ['yes', '1', 'TRUE'] }, coolerFilters).filters,
    ).toEqual([]);
  });

  it('drops a manufacturer the Category does not offer', () => {
    expect(
      readCategoryQuery({ manufacturer: ['Made-up', 'AMD'] }, cpuFilters).manufacturers,
    ).toEqual(['AMD']);
  });

  // Without the answer of the Category's filters nothing can be checked
  // against what they offer, so nothing is read but the search and the page.
  it("reads no filter, manufacturer or price range without the answer of the Category's filters", () => {
    expect(
      readCategoryQuery({
        search: 'ryzen',
        manufacturer: 'AMD',
        socket: 'AM5',
        lowest: '100000',
        page: '2',
      }),
    ).toEqual(aQuery({ search: 'ryzen', page: 2 }));
  });
});

// The price range: two whole numbers in the chosen currency, typed in
// Western, Arabic-Indic or Eastern Arabic-Indic digits, read through the
// shared reading of digits, which drops separators. A value that is not a
// whole number, or a lowest above the highest, is not sent, and the form
// says why beside its field.
describe("a Category page's price range, read from its address", () => {
  it('reads both ends as whole numbers', () => {
    const read = readCategoryQuery({ lowest: '150000', highest: '400000' }, cpuFilters);
    expect([read.lowest, read.highest]).toEqual([150_000, 400_000]);
  });

  it('reads one end alone', () => {
    expect(readCategoryQuery({ highest: '400000' }, cpuFilters)).toEqual(
      aQuery({ highest: 400_000 }),
    );
    expect(readCategoryQuery({ lowest: '150000' }, cpuFilters)).toEqual(
      aQuery({ lowest: 150_000 }),
    );
  });

  it.each([
    ['Western digits with commas', '250,000'],
    ['Arabic-Indic digits with the Arabic thousands separator', '٢٥٠٬٠٠٠'],
    ['Arabic-Indic digits with the Arabic comma', '٢٥٠،٠٠٠'],
    ['Eastern Arabic-Indic digits with spaces', '۲۵۰ ۰۰۰'],
    ['digits with spaces around them', '  250000 '],
    ['leading zeros', '000250000'],
  ])('reads %s', (_typed, typed) => {
    expect(readCategoryQuery({ lowest: typed }, cpuFilters).lowest).toBe(250_000);
  });

  it('reads 0 as the lowest end', () => {
    expect(readCategoryQuery({ lowest: '0' }, cpuFilters).lowest).toBe(0);
  });

  it.each(['2.5', '٢٫٥', '-5', '+5', '1e6', 'abc', '250k', '١٠٠ IQD'])(
    'drops "%s", which is not a whole number, and says so',
    (typed) => {
      expect(readCategoryQuery({ lowest: typed, highest: typed }, cpuFilters)).toEqual(
        aQuery({}),
      );
      expect(readPriceRange({ lowest: typed }, cpuFilters).lowest).toEqual({
        typed,
        value: null,
        problem: 'notAWholeNumber',
      });
    },
  );

  // The API reads at most 15 digits, so that each end is read exactly; no
  // price comes near.
  it('drops a number of more than 15 digits, and says it is too large', () => {
    const typed = '1234567890123456';
    expect(readCategoryQuery({ highest: typed }, cpuFilters).highest).toBeNull();
    expect(readPriceRange({ highest: typed }, cpuFilters).highest).toEqual({
      typed,
      value: null,
      problem: 'tooLarge',
    });
  });

  it.each(['', '   '])('reads "%s" as no end, with nothing to say', (typed) => {
    expect(readPriceRange({ lowest: typed }, cpuFilters).lowest).toEqual({
      typed: '',
      value: null,
      problem: null,
    });
  });

  // The lowest above the highest is the lowest's mistake: it alone is
  // dropped, as the API names the lowest when it refuses such a range.
  it('drops a lowest above the highest, keeps the highest, and says so beside the lowest', () => {
    expect(readCategoryQuery({ lowest: '500000', highest: '200000' }, cpuFilters)).toEqual(
      aQuery({ highest: 200_000 }),
    );
    expect(readPriceRange({ lowest: '500000', highest: '200000' }, cpuFilters)).toEqual({
      lowest: { typed: '500000', value: null, problem: 'aboveTheHighest' },
      highest: { typed: '200000', value: 200_000, problem: null },
    });
  });

  it('reads a lowest equal to the highest', () => {
    const read = readCategoryQuery({ lowest: '200000', highest: '200000' }, cpuFilters);
    expect([read.lowest, read.highest]).toEqual([200_000, 200_000]);
  });

  it('keeps what was typed, for the field to show it again', () => {
    expect(readPriceRange({ lowest: ' ٢٥٠٬٠٠٠ ' }, cpuFilters).lowest).toEqual({
      typed: '٢٥٠٬٠٠٠',
      value: 250_000,
      problem: null,
    });
  });

  // When no Visible Part of the Category has a Lowest Price, any range finds
  // nothing, and the form offers none.
  it('drops the price range when the Category offers none, with nothing to say', () => {
    expect(readCategoryQuery({ lowest: '100', highest: '900' }, noPrices)).toEqual(
      aQuery({}),
    );
    expect(readPriceRange({ lowest: 'abc' }, noPrices).lowest.problem).toBeNull();
  });

  it('reads the first of a repeated end', () => {
    expect(readCategoryQuery({ lowest: ['100', '200'] }, cpuFilters).lowest).toBe(100);
  });
});

// The query of an address, as Next hands it to a page.
function queryOf(address: string): Record<string, string | string[]> {
  const read: Record<string, string | string[]> = {};
  for (const [name, value] of new URL(address, 'https://parts.example').searchParams) {
    const before = read[name];
    read[name] = before === undefined ? value : [before, value].flat();
  }
  return read;
}

// A Category page's address, written back from a query: for the page's own
// links, to its other pages, to the list without one of its choices and to
// the list with none.
describe("a Category page's address, written from its query", () => {
  it('is the Category page alone for the first page with nothing on', () => {
    expect(categoryPageAddress('en', 'cpu', nothingOn)).toBe('/en/categories/cpu');
  });

  it('holds the search', () => {
    expect(categoryPageAddress('en', 'gpu', aQuery({ search: 'rtx 4070' }))).toBe(
      '/en/categories/gpu?search=rtx+4070',
    );
  });

  it('holds a page after the first', () => {
    expect(categoryPageAddress('en', 'gpu', aQuery({ page: 2 }))).toBe(
      '/en/categories/gpu?page=2',
    );
  });

  // The order of a filled-in form: the search, the manufacturers, each
  // filter as the Category offers them, the price range, and then the page.
  it('holds the search, the manufacturers, each filter, the price range and the page, in that order', () => {
    expect(
      categoryPageAddress(
        'en',
        'cpu',
        aQuery({
          search: 'ryzen',
          manufacturers: ['AMD', 'Intel'],
          filters: [
            { parameter: 'socket', values: ['AM4', 'LGA 1700'] },
            { parameter: 'cores', values: [8, 16] },
          ],
          lowest: 100_000,
          highest: 500_000,
          page: 3,
        }),
      ),
    ).toBe(
      '/en/categories/cpu?search=ryzen&manufacturer=AMD&manufacturer=Intel&socket=AM4&socket=LGA+1700&cores=8&cores=16&lowest=100000&highest=500000&page=3',
    );
  });

  it('writes yes or no as true or false, and 0 as a lowest end', () => {
    expect(
      categoryPageAddress(
        'en',
        'cpuCooler',
        aQuery({ filters: [{ parameter: 'waterCooled', values: [false] }], lowest: 0 }),
      ),
    ).toBe('/en/categories/cpu-cooler?waterCooled=false&lowest=0');
  });

  it.each([
    ['ckb', '/ckb/categories/cpu-cooler?search=noctua&page=2'],
    ['ar', '/ar/categories/cpu-cooler?search=noctua&page=2'],
    ['en', '/en/categories/cpu-cooler?search=noctua&page=2'],
  ] as const)('is in the language of the page, %s', (language, address) => {
    expect(
      categoryPageAddress(language, 'cpuCooler', aQuery({ search: 'noctua', page: 2 })),
    ).toBe(address);
  });

  it('writes a page read in Arabic-Indic digits, and a search and a price range with them, in Western digits', () => {
    const query = readCategoryQuery(
      { search: 'rtx ٤٠٧٠', page: '٣', highest: '٥٠٠٬٠٠٠' },
      cpuFilters,
    );
    expect(categoryPageAddress('ckb', 'gpu', query)).toBe(
      '/ckb/categories/gpu?search=rtx+4070&highest=500000&page=3',
    );
  });

  it.each([
    aQuery({ search: 'پرۆسێسەر ryzen' }),
    aQuery({ search: 'a&b=c+d?e#f', page: 12 }),
    aQuery({ page: 1_000_001 }),
    aQuery({
      search: 'ryzen 7',
      manufacturers: ['AMD'],
      filters: [
        { parameter: 'socket', values: ['AM5', 'LGA 1700'] },
        { parameter: 'cores', values: [6] },
      ],
      lowest: 0,
      highest: 755_000,
      page: 2,
    }),
  ])('writes an address that reads back as the same query, %o', (query) => {
    expect(
      readCategoryQuery(queryOf(categoryPageAddress('ckb', 'cpu', query)), cpuFilters),
    ).toEqual(query);
  });

  it('writes an address of yes or no that reads back as the same query', () => {
    const query = aQuery({
      filters: [
        { parameter: 'waterCooled', values: [false, true] },
        { parameter: 'radiatorSize', values: [360] },
      ],
    });
    expect(
      readCategoryQuery(
        queryOf(categoryPageAddress('en', 'cpuCooler', query)),
        coolerFilters,
      ),
    ).toEqual(query);
  });
});

// The choices that are on, each of which the Shopper can clear on its own,
// and all of which they can clear at once (DESIGN.md's The choices that are
// on): the search's words, each manufacturer, each value of a filter, and
// the price range as one. The list without a choice starts again at its
// first page.
describe("a Category page's choices that are on, and clearing them", () => {
  const everything = aQuery({
    search: 'ryzen',
    manufacturers: ['AMD'],
    filters: [
      { parameter: 'socket', values: ['AM4', 'AM5'] },
      { parameter: 'cores', values: [8] },
    ],
    lowest: 100_000,
    highest: 500_000,
    page: 3,
  });

  it('lists each choice that is on, in the order of the address', () => {
    expect(choicesOn(everything).map(({ without: _without, ...choice }) => choice)).toEqual(
      [
        { kind: 'search', search: 'ryzen' },
        { kind: 'manufacturer', manufacturer: 'AMD' },
        { kind: 'filter', parameter: 'socket', value: 'AM4' },
        { kind: 'filter', parameter: 'socket', value: 'AM5' },
        { kind: 'filter', parameter: 'cores', value: 8 },
        { kind: 'price', lowest: 100_000, highest: 500_000 },
      ],
    );
  });

  it('lists none when nothing is on, on any page', () => {
    expect(choicesOn(aQuery({ page: 4 }))).toEqual([]);
  });

  it('clears the search alone, from the first page', () => {
    expect(categoryPageAddress('en', 'cpu', choicesOn(everything)[0].without)).toBe(
      '/en/categories/cpu?manufacturer=AMD&socket=AM4&socket=AM5&cores=8&lowest=100000&highest=500000',
    );
  });

  it('clears a manufacturer alone', () => {
    expect(categoryPageAddress('en', 'cpu', choicesOn(everything)[1].without)).toBe(
      '/en/categories/cpu?search=ryzen&socket=AM4&socket=AM5&cores=8&lowest=100000&highest=500000',
    );
  });

  it("clears one of a filter's values alone, and keeps its others", () => {
    expect(categoryPageAddress('en', 'cpu', choicesOn(everything)[3].without)).toBe(
      '/en/categories/cpu?search=ryzen&manufacturer=AMD&socket=AM4&cores=8&lowest=100000&highest=500000',
    );
  });

  it("clears a filter's last value, and the filter with it", () => {
    expect(choicesOn(everything)[4].without.filters).toEqual([
      { parameter: 'socket', values: ['AM4', 'AM5'] },
    ]);
  });

  it('clears both ends of the price range together', () => {
    expect(categoryPageAddress('en', 'cpu', choicesOn(everything)[5].without)).toBe(
      '/en/categories/cpu?search=ryzen&manufacturer=AMD&socket=AM4&socket=AM5&cores=8',
    );
  });

  it('lists a price range of one end as one choice', () => {
    expect(
      choicesOn(aQuery({ highest: 500_000 })).map(
        ({ without: _without, ...choice }) => choice,
      ),
    ).toEqual([{ kind: 'price', lowest: null, highest: 500_000 }]);
  });

  it('clears them all at once to the Category page alone', () => {
    expect(categoryPageAddress('ar', 'cpu', nothingOn)).toBe('/ar/categories/cpu');
  });
});

// The address the filters' form is sent to with script, which applies a
// choice as soon as it is made: the fields as the form holds them, as a
// browser sends a form without script, but for those left empty, so that the
// address holds only what is on. What the Shopper typed is kept as typed,
// for the page to read and to say why beside a field it cannot use.
describe("the address of the filters' form, sent with script", () => {
  it('holds each field the form sends, in its order, a repeated one in each place', () => {
    expect(
      addressOfTheForm('/en/categories/cpu', [
        ['search', 'ryzen'],
        ['manufacturer', 'AMD'],
        ['socket', 'AM4'],
        ['socket', 'LGA 1700'],
        ['lowest', '100000'],
        ['highest', '500000'],
      ]),
    ).toBe(
      '/en/categories/cpu?search=ryzen&manufacturer=AMD&socket=AM4&socket=LGA+1700&lowest=100000&highest=500000',
    );
  });

  it('leaves out the fields left empty, or holding spaces alone', () => {
    expect(
      addressOfTheForm('/ckb/categories/cpu', [
        ['search', ''],
        ['socket', 'AM5'],
        ['lowest', '  '],
        ['highest', ''],
      ]),
    ).toBe('/ckb/categories/cpu?socket=AM5');
  });

  it('is the Category page alone when every field is empty', () => {
    expect(
      addressOfTheForm('/en/categories/gpu', [
        ['search', ''],
        ['lowest', ''],
        ['highest', ''],
      ]),
    ).toBe('/en/categories/gpu');
  });

  it('keeps what was typed, trimmed, for the page to read', () => {
    expect(
      addressOfTheForm('/ckb/categories/cpu', [
        ['search', ' rtx ٤٠٧٠ '],
        ['lowest', ' ٢٥٠٬٠٠٠ '],
        ['highest', '2.5'],
      ]),
    ).toBe(
      `/ckb/categories/cpu?search=${encodeURIComponent('rtx ٤٠٧٠').replace('%20', '+')}&lowest=${encodeURIComponent('٢٥٠٬٠٠٠')}&highest=2.5`,
    );
  });
});
