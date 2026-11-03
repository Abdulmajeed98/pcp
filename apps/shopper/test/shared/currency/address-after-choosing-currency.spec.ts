import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { addressAfterChoosingCurrency } from '@/shared/currency';

// The currency switch sends the page the Shopper was on, as the part of its
// address after the language, with its query. The answer returns them there.
describe('the address the currency switch returns to', () => {
  it.each<[Language, string]>([
    ['ckb', '/ckb/categories/cpu?search=ryzen'],
    ['ar', '/ar/categories/cpu?search=ryzen'],
    ['en', '/en/categories/cpu?search=ryzen'],
  ])('keeps the language of the address, %s', (language, address) => {
    expect(addressAfterChoosingCurrency(language, '/categories/cpu?search=ryzen')).toBe(
      address,
    );
  });

  // A filter with several values repeats its parameter, and each is kept, in
  // its place, as the page wrote it.
  it('keeps the rest of the query as it is, a repeated parameter among it', () => {
    expect(
      addressAfterChoosingCurrency(
        'en',
        '/categories/cpu?manufacturer=AMD&search=ryzen+7&manufacturer=Intel&lowest=150000&page=2',
      ),
    ).toBe('/en/categories/cpu?manufacturer=AMD&search=ryzen+7&manufacturer=Intel&page=2');
  });

  // A price range is typed in the currency the Shopper had, so it is never
  // read in the other.
  it('drops the lowest price of a price range', () => {
    expect(
      addressAfterChoosingCurrency('en', '/categories/cpu?search=ryzen&lowest=150000'),
    ).toBe('/en/categories/cpu?search=ryzen');
  });

  it('drops the highest price of a price range', () => {
    expect(
      addressAfterChoosingCurrency('en', '/categories/cpu?highest=900000&search=ryzen'),
    ).toBe('/en/categories/cpu?search=ryzen');
  });

  it('drops both ends of a price range together', () => {
    expect(
      addressAfterChoosingCurrency(
        'en',
        '/categories/cpu?lowest=150000&search=ryzen&highest=900000',
      ),
    ).toBe('/en/categories/cpu?search=ryzen');
  });

  it('returns a page with no query with none', () => {
    expect(addressAfterChoosingCurrency('en', '/categories/cpu')).toBe(
      '/en/categories/cpu',
    );
  });

  it('returns a page whose query held only a price range with none', () => {
    expect(
      addressAfterChoosingCurrency('en', '/categories/cpu?highest=900000&lowest=150000'),
    ).toBe('/en/categories/cpu');
  });

  // The form can be sent with anything in place of the page. What does not
  // start as a page's address after the language does is not one of the
  // Shopper app's pages.
  it.each<[string, unknown]>([
    ['another site', 'https://example.com/categories/cpu?search=ryzen'],
    ['a path with no slash first', 'categories/cpu'],
    ['nothing', ''],
    ['no page at all', null],
  ])('returns to the first page when it is sent %s', (_, page) => {
    expect(addressAfterChoosingCurrency('ar', page)).toBe('/ar');
  });
});
