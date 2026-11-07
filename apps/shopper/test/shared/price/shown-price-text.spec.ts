import type { ShownPriceResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { shownPriceText } from '@/shared/price';

function price(
  currency: ShownPriceResponse['currency'],
  amount: string,
  converted = false,
): ShownPriceResponse {
  return { currency, amount, converted };
}

// A Shown Price as the Shopper app draws it in every language: its figure in
// Western digits, grouped in thousands with commas, its unit, IQD or $, and
// "≈" before the figure when it is a Converted Price (PRC-3, LANG-5). It is
// one left-to-right unit, the same in Kurdish, Arabic and English, so
// nothing here depends on the page's language.
describe('a Shown Price as it is drawn', () => {
  it('writes dinars in whole dinars, grouped in thousands, with IQD', () => {
    expect(shownPriceText(price('IQD', '1575000'))).toEqual({
      approximate: false,
      figure: '1,575,000',
      unit: 'IQD',
    });
  });

  it('writes dollars with their cents as the Vendor quoted them, with $', () => {
    expect(shownPriceText(price('USD', '1250.50'))).toEqual({
      approximate: false,
      figure: '1,250.50',
      unit: '$',
    });
  });

  // The API answers dollars with two decimal places, and a whole number of
  // dollars, such as a Converted Price rounded to the dollar, has none worth
  // showing.
  it('writes whole dollars without cents', () => {
    expect(shownPriceText(price('USD', '350.00')).figure).toBe('350');
  });

  it.each([
    ['IQD', '575000', '575,000'],
    ['USD', '365.00', '365'],
  ] as const)(
    'marks a Converted Price in %s as approximate',
    (currency, amount, figure) => {
      expect(shownPriceText(price(currency, amount, true))).toEqual({
        approximate: true,
        figure,
        unit: currency === 'IQD' ? 'IQD' : '$',
      });
    },
  );

  it('writes no digit but the Western ones', () => {
    const { figure } = shownPriceText(price('IQD', '123456789'));
    expect(figure).toMatch(/^[0-9,]+$/);
  });

  // Each currency, quoted and converted: the "≈" goes with a Converted Price
  // alone, whichever currency it is in, and never changes the figure or the
  // mark. The function takes no language: a Shown Price is the same on a
  // Kurdish, an Arabic and an English page (LANG-5, `words.md`'s
  // currencies), which `pnpm platform:check` reads on every price of a
  // Category page in the three.
  it.each([
    ['IQD', '250000', false, { approximate: false, figure: '250,000', unit: 'IQD' }],
    ['IQD', '250000', true, { approximate: true, figure: '250,000', unit: 'IQD' }],
    ['USD', '167.00', false, { approximate: false, figure: '167', unit: '$' }],
    ['USD', '167.00', true, { approximate: true, figure: '167', unit: '$' }],
    ['USD', '99.95', false, { approximate: false, figure: '99.95', unit: '$' }],
  ] as const)('writes %s %s, converted %s, as %o', (currency, amount, converted, drawn) => {
    expect(shownPriceText(price(currency, amount, converted))).toEqual(drawn);
  });
});
