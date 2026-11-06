import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { addressInLanguage } from '@/shared/i18n';

// The language switch leads to the page the Shopper is on, in another
// language. It is given the page's address as the browser shows it, its
// language first, and the page's query.
describe("the language switch's address for a page", () => {
  it.each<[Language, string]>([
    ['ckb', '/ckb/categories/cpu'],
    ['ar', '/ar/categories/cpu'],
    ['en', '/en/categories/cpu'],
  ])('is the same page in %s', (language, address) => {
    expect(addressInLanguage(language, '/en/categories/cpu', '')).toBe(address);
  });

  // A search, the filters and the page are in the query, so a switch of
  // language keeps them (story 29), a repeated parameter among them.
  it('keeps the query as the page wrote it', () => {
    expect(
      addressInLanguage(
        'ckb',
        '/en/categories/cpu',
        'search=ryzen+7&manufacturer=AMD&manufacturer=Intel&page=2',
      ),
    ).toBe('/ckb/categories/cpu?search=ryzen+7&manufacturer=AMD&manufacturer=Intel&page=2');
  });

  // A price range is typed in the chosen currency, which a switch of
  // language keeps, so the range is kept too.
  it('keeps a price range', () => {
    expect(
      addressInLanguage('ar', '/ckb/categories/gpu', 'lowest=150000&highest=900000'),
    ).toBe('/ar/categories/gpu?lowest=150000&highest=900000');
  });

  it('leads to the first page in the language, with its query or with none', () => {
    expect(addressInLanguage('en', '/ckb', '')).toBe('/en');
    expect(addressInLanguage('en', '/ckb', 'search=ryzen')).toBe('/en?search=ryzen');
  });

  it('leads to an address that matches no page in the language, as it is', () => {
    expect(addressInLanguage('ar', '/en/no-such-page', '')).toBe('/ar/no-such-page');
  });
});
