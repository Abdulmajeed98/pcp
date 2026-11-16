import { ShownPrice } from '../offer/shown-price';

// A Build's prices as PRC-5 adds them up, written once for both price views:
// each Shown Price as answered, after rounding, times its quantity, and a
// total marked converted when any price in it is a Converted Price, which a
// Shopper sees marked "≈". Every amount is a whole number of the currency's
// unit, so the sums are exact.

// A Shown Price times a Part's quantity: a RAM kit's or a drive's, and one of
// any other Part.
export function timesQuantity(price: ShownPrice, quantity: number | undefined): ShownPrice {
  return new ShownPrice(
    price.getCurrency(),
    price.getAmount() * (quantity ?? 1),
    price.isConverted(),
  );
}

// Prices in one currency added up, marked converted when any of them is: none
// when there is no price to add.
export function totalOf(prices: readonly ShownPrice[]): ShownPrice | null {
  const [first] = prices;
  if (first === undefined) return null;
  return new ShownPrice(
    first.getCurrency(),
    prices.reduce((total, price) => total + price.getAmount(), 0),
    prices.some((price) => price.isConverted()),
  );
}
