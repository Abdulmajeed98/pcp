import { formatNumber } from '@pcp/i18n';

// A Quoted Price in USD as the dashboard shows it: the amount in Western
// digits, grouped in thousands by `formatNumber`, then "$" (LANG-5). The API
// answers it as a decimal string with two decimal places, "1250.50", so that
// no binary fraction reaches the page. Whole dollars are shown without
// cents, "350 $", and a price with cents keeps both its digits, "1,250.50 $",
// as the Vendor wrote it: the dollars are grouped by `formatNumber`, and the
// cents are the answer's own two digits.
export function usdPriceShown(usdPrice: string): string {
  const [dollars, cents = '00'] = usdPrice.split('.');
  const grouped = formatNumber(Number(dollars));
  return cents === '00' ? `${grouped} $` : `${grouped}.${cents} $`;
}

// A Quoted Price in IQD as the dashboard shows it: whole dinars in Western
// digits, grouped in thousands by `formatNumber`, then "IQD".
export function iqdPriceShown(iqdPrice: number): string {
  return `${formatNumber(iqdPrice)} IQD`;
}
