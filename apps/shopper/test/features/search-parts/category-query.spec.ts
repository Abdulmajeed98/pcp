import { describe, expect, it } from 'vitest';

import { categoryPageAddress, readCategoryQuery } from '@/features/search-parts';

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

  // Nothing but the search and the page is read: every other parameter, a
  // page size among them, is ignored.
  it('ignores every other parameter', () => {
    expect(
      readCategoryQuery({
        search: 'ryzen',
        page: '2',
        size: '100',
        sort: 'name',
        x: ['1'],
      }),
    ).toEqual({ search: 'ryzen', page: 2 });
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
// links, to its other pages and to the list without its search.
describe("a Category page's address, written from its query", () => {
  it('is the Category page alone for the first page with no search', () => {
    expect(categoryPageAddress('en', 'cpu', { search: '', page: 1 })).toBe(
      '/en/categories/cpu',
    );
  });

  it('holds the search', () => {
    expect(categoryPageAddress('en', 'gpu', { search: 'rtx 4070', page: 1 })).toBe(
      '/en/categories/gpu?search=rtx+4070',
    );
  });

  it('holds a page after the first', () => {
    expect(categoryPageAddress('en', 'gpu', { search: '', page: 2 })).toBe(
      '/en/categories/gpu?page=2',
    );
  });

  it('holds the search and then the page', () => {
    expect(categoryPageAddress('en', 'gpu', { search: 'rtx 4070', page: 3 })).toBe(
      '/en/categories/gpu?search=rtx+4070&page=3',
    );
  });

  it.each([
    ['ckb', '/ckb/categories/cpu-cooler?search=noctua&page=2'],
    ['ar', '/ar/categories/cpu-cooler?search=noctua&page=2'],
    ['en', '/en/categories/cpu-cooler?search=noctua&page=2'],
  ] as const)('is in the language of the page, %s', (language, address) => {
    expect(categoryPageAddress(language, 'cpuCooler', { search: 'noctua', page: 2 })).toBe(
      address,
    );
  });

  // The list without its search starts again at its first page.
  it('drops the search when the search is cleared', () => {
    const query = readCategoryQuery({ search: 'rtx', page: '4' });
    expect(categoryPageAddress('en', 'gpu', { ...query, search: '', page: 1 })).toBe(
      '/en/categories/gpu',
    );
  });

  it('writes a page read in Arabic-Indic digits, and a search with them, in Western digits', () => {
    const query = readCategoryQuery({ search: 'rtx ٤٠٧٠', page: '٣' });
    expect(categoryPageAddress('ckb', 'gpu', query)).toBe(
      '/ckb/categories/gpu?search=rtx+4070&page=3',
    );
  });

  it.each([
    { search: 'پرۆسێسەر ryzen', page: 1 },
    { search: 'a&b=c+d?e#f', page: 12 },
    { search: '', page: 1_000_001 },
  ])('writes an address that reads back as the same query, %o', (query) => {
    expect(readCategoryQuery(queryOf(categoryPageAddress('ckb', 'ram', query)))).toEqual(
      query,
    );
  });
});
