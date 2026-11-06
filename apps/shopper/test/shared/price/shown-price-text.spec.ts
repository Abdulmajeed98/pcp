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
});
