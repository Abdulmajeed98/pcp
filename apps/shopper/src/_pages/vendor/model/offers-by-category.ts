import type { VisibleOfferOfVendorResponse } from '@pcp/api-client';

import type { Category } from '@/entities/category';

// The Offers of one Category on a page of a Vendor's list.
export interface OffersOfACategory {
  category: Category;
  offers: VisibleOfferOfVendorResponse[];
}

// A page of a Vendor's Offers, grouped by Category, each group under its
// Category's name (DESIGN.md's An Offer, on a Vendor page). The API answers
// a Vendor's Offers grouped in the catalog's order of the eight, and in
// OFF-11's order within each, in stock first and then the lowest Shown
// Price, so each group is a run of the page, and the groups and the Offers
// in them keep the order the API gave them; nothing is sorted again here.
// Paging runs across the groups, so a Category may go on from one page to
// the next, under its name on each.
export function offersByCategory(
  offers: readonly VisibleOfferOfVendorResponse[],
): OffersOfACategory[] {
  const groups: OffersOfACategory[] = [];
  for (const offer of offers) {
    const last = groups.at(-1);
    if (last?.category === offer.part.category) last.offers.push(offer);
    else groups.push({ category: offer.part.category, offers: [offer] });
  }
  return groups;
}
