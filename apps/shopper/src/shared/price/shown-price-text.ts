import type { ShownPriceResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';

import { currencyMarks } from '@/shared/currency';

// A Shown Price as the Shopper app draws it, in every language alike: its
// figure in Western digits, written by `formatNumber`, grouped in thousands
// with commas; its unit, the mark every price carries, IQD or $; and whether
// it is a Converted Price, which is drawn with "≈" before the figure (PRC-3).
// No Shopper code converts or rounds a price: the figure is the API's amount
// as it answered it.
//
// The API answers dinars in whole dinars, and dollars with two decimal
// places, "1250.50", so that no binary fraction reaches the page. A whole
// number of dollars is written without its cents, "350", and one with cents
// keeps both its digits, "1,250.50", as the Vendor wrote it.
export function shownPriceText(price: ShownPriceResponse): {
  approximate: boolean;
  figure: string;
  unit: string;
} {
  const [whole, cents = '00'] = price.amount.split('.');
  const grouped = formatNumber(Number(whole));
  return {
    approximate: price.converted,
    figure: price.currency === 'USD' && cents !== '00' ? `${grouped}.${cents}` : grouped,
    unit: currencyMarks[price.currency],
  };
}
