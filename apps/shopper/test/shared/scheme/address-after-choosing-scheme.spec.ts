import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { addressAfterChoosingScheme } from '@/shared/scheme';

// The scheme switch sends the page the Shopper was on, as the part of its
// address after the language, with its query. The answer returns them there,
// in the colours they chose.
describe('the address the scheme switch returns to', () => {
  it.each<[Language, string]>([
    ['ckb', '/ckb/categories/cpu?search=ryzen'],
    ['ar', '/ar/categories/cpu?search=ryzen'],
    ['en', '/en/categories/cpu?search=ryzen'],
  ])('keeps the language of the address, %s', (language, address) => {
    expect(addressAfterChoosingScheme(language, '/categories/cpu?search=ryzen')).toBe(
      address,
    );
  });

  // The colours change nothing a page lists, so the whole query is kept as
  // the page wrote it, a price range and a repeated parameter among it.
  it('keeps the whole query as it is', () => {
    expect(
      addressAfterChoosingScheme(
        'en',
        '/categories/cpu?manufacturer=AMD&lowest=150000&manufacturer=Intel&highest=900000&page=2',
      ),
    ).toBe(
      '/en/categories/cpu?manufacturer=AMD&lowest=150000&manufacturer=Intel&highest=900000&page=2',
    );
  });

  it('returns the first page as it was sent, with no query or with one', () => {
    expect(addressAfterChoosingScheme('ckb', '')).toBe('/ckb');
    expect(addressAfterChoosingScheme('ckb', '?search=ryzen')).toBe('/ckb?search=ryzen');
  });

  it('returns a page with no query with none', () => {
    expect(addressAfterChoosingScheme('en', '/no-such-page')).toBe('/en/no-such-page');
  });

  // The form can be sent with anything in place of the page. What does not
  // start as a page's address after the language does is not one of the
  // Shopper app's pages.
  it.each<[string, unknown]>([
    ['another site', 'https://example.com/categories/cpu?search=ryzen'],
    ['a path with no slash first', 'categories/cpu'],
    ['no page at all', null],
  ])('returns to the first page when it is sent %s', (_, page) => {
    expect(addressAfterChoosingScheme('ar', page)).toBe('/ar');
  });

  // An address that starts with two slashes would lead to another site, but
  // the language's own path comes first, so it is a page of the Shopper app.
  it('keeps the language first before an address that starts with two slashes', () => {
    expect(addressAfterChoosingScheme('ar', '//example.com')).toBe('/ar//example.com');
  });
});
