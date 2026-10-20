import { formatNumber } from '@pcp/i18n';

// A Quoted Price in USD as the dashboard writes its amount: in Western
// digits, grouped in thousands by `formatNumber` (LANG-5). The API answers it
// as a decimal string with two decimal places, "1250.50", so that no binary
// fraction reaches the page. Whole dollars are written without cents, "350",
// and a price with cents keeps both its digits, "1,250.50", as the Vendor
// wrote it: the dollars are grouped by `formatNumber`, and the cents are the
// answer's own two digits.
export function usdAmountWritten(usdPrice: string): string {
  const [dollars, cents = '00'] = usdPrice.split('.');
  const grouped = formatNumber(Number(dollars));
  return cents === '00' ? grouped : `${grouped}.${cents}`;
}

// A Quoted Price in USD as the dashboard shows it: its amount, then "$",
// "1,250.50 $".
export function usdPriceShown(usdPrice: string): string {
  return `${usdAmountWritten(usdPrice)} $`;
}

// A Quoted Price in IQD as the dashboard writes its amount: whole dinars in
// Western digits, grouped in thousands by `formatNumber`.
export function iqdAmountWritten(iqdPrice: number): string {
  return formatNumber(iqdPrice);
}

// A Quoted Price in IQD as the dashboard shows it: its amount, then "IQD",
// "1,875,000 IQD".
export function iqdPriceShown(iqdPrice: number): string {
  return `${iqdAmountWritten(iqdPrice)} IQD`;
}
