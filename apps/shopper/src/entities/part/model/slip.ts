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
}

export function slipOf(offers: readonly VisibleOfferResponse[]): Slip {
  const priced = offers.filter((offer) => offer.inStock && offer.shownPrice !== null);
  return {
    lowest: priced.at(0),
    highestInStock: priced.at(-1)?.shownPrice ?? undefined,
    vendors: offers.length,
    inStock: offers.filter((offer) => offer.inStock).length,
    converted: offers.filter((offer) => offer.shownPrice?.converted === true).length,
  };
}
