import type { ShownPriceResponse, VisibleOfferResponse } from '@pcp/api-client';

// A Part's figures, as its price slip prints them (DESIGN.md's The price
// slip), read from the Part's Visible Offers as the API answers them, in
// OFF-11's order: in stock first, then the lowest Shown Price, an Offer with
// no Shown Price last of its stock. Nothing here converts, rounds or
// compares a price: each figure is an Offer's own, picked by its place.
export interface Slip {
  // The first Offer in stock with a Shown Price: its price is the Part's
  // Lowest Price, and its Confirmation and its Vendor sign the slip.
  lowest: VisibleOfferResponse | undefined;
  // The Shown Price of the last Offer in stock with one.
  highestInStock: ShownPriceResponse | undefined;
  // How many Vendors offer the Part, one Offer each, in stock or not.
  vendors: number;
  inStock: number;
  // How many of the Offers show a Converted Price, marked "≈".
  converted: number;
  // Whether every Vendor has the Part out of stock, which the slip and the
  // plate then say in the Lowest Price's place. A Part in stock with no
  // Lowest Price is not: its Offers in stock are all quoted in the other
  // currency, which happens only before the Admin sets the first Platform
  // Rate, and the Lowest Price is then left out, as a Category page leaves
  // it out.
  outOfStockEverywhere: boolean;
}

export function slipOf(offers: readonly VisibleOfferResponse[]): Slip {
  const priced = offers.filter((offer) => offer.inStock && offer.shownPrice !== null);
  const inStock = offers.filter((offer) => offer.inStock).length;
  return {
    lowest: priced.at(0),
    highestInStock: priced.at(-1)?.shownPrice ?? undefined,
    vendors: offers.length,
    inStock,
    converted: offers.filter((offer) => offer.shownPrice?.converted === true).length,
    outOfStockEverywhere: inStock === 0,
  };
}
