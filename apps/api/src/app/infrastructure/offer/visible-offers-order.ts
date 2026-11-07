import { asc, desc, sql, SQL } from 'drizzle-orm';

import { placeOfCategory } from '~/infrastructure/part/category-order';
import { part } from '~/infrastructure/part/part.schema';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer } from './offer.schema';

// OFF-11's order of visible Offers (PRC-4), given their Shown Price: in stock
// first, then the lowest Shown Price as answered, after rounding, with none
// after the others; then the most recent Confirmation. Each list of them
// adds what tells its Offers apart, so that the order is the same at every
// read.
function inOff11sOrder(shownAmount: SQL): SQL[] {
  return [desc(offer.inStock), sql`${shownAmount} asc nulls last`, desc(offer.confirmedAt)];
}

// The order of a Part's visible Offers: OFF-11's, then the Vendor's name and
// the Offer's identifier. A query that uses it joins the Vendor.
export function inTheOrderOfAPartsOffers(shownAmount: SQL): SQL[] {
  return [...inOff11sOrder(shownAmount), asc(vendor.name), asc(offer.id)];
}

// The order of a Vendor's visible Offers: by their Parts' Categories, in the
// catalog's order, and within each Category OFF-11's, then the Part's name
// and the Offer's identifier. A query that uses it joins the Part.
export function inTheOrderOfAVendorsOffers(shownAmount: SQL): SQL[] {
  return [
    placeOfCategory(part.category),
    ...inOff11sOrder(shownAmount),
    asc(part.name),
    asc(offer.id),
  ];
}
