import { describe, expect, it } from 'vitest';

import { pageInTheAddress } from '@/shared/lib';

// The page of a list an address names, counted from 1 as "Page 2 of 17"
// counts it: a Category page's and a Vendor page's, each paged in its
// address so that it can be reloaded, linked and shared.
describe('the page of a list, read from its address', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    ['17', 17],
    [' 3 ', 3],
  ])('reads the page %s as page %i', (page, read) => {
    expect(pageInTheAddress(page)).toBe(read);
  });

  it('reads an address with no page as the first page', () => {
    expect(pageInTheAddress(undefined)).toBe(1);
  });

  it.each([
    ['Arabic-Indic', '٢', 2],
    ['Eastern Arabic-Indic', '۱۲', 12],
  ])('reads a page in %s digits, as a Kurdish keyboard types it', (_digits, page, read) => {
    expect(pageInTheAddress(page)).toBe(read);
  });

  // A page that cannot be read leads to a list all the same: its first page.
  it.each(['', '0', '-2', '2.5', '1e3', '+2', 'two'])(
    'reads the page "%s", which is not a whole number from 1, as the first page',
    (page) => {
      expect(pageInTheAddress(page)).toBe(1);
    },
  );

  it('reads the first page of an address that repeats it', () => {
    expect(pageInTheAddress(['3', '5'])).toBe(3);
  });

  // The API pages a list to its page 1,000,000, counted from 0, and no list
  // has that many pages, so a page past it is past the last page of any list.
  it('reads a page past the last the API pages to as that last, past every list', () => {
    expect(pageInTheAddress('99999999999999999999')).toBe(1_000_001);
    expect(pageInTheAddress('1000001')).toBe(1_000_001);
  });
});
