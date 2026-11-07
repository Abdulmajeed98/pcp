import type { VisibleOfferOfVendorPageResponse } from '@pcp/api-client';

// What the sheet of a Vendor's Offers shows: a page of them, or why it lists
// none.
export type OffersSheetState =
  | { kind: 'listed'; page: VisibleOfferOfVendorPageResponse }
  | { kind: 'none' }
  | { kind: 'past-the-end'; totalPages: number }
  | { kind: 'not-read' };

// What the sheet of a Vendor's Offers shows, from the page of them the API
// answered (DESIGN.md's Its Offers): the Offers when the page holds some;
// that the Vendor has no Offer to show now when it has no Visible Offer at
// all, its contact details still showing how to reach it; how many pages
// its list has when the page asked is past the last, as an old link may
// ask; and that the Offers cannot be read when the API did not answer them.
export function whatTheOffersSheetShows(
  page: VisibleOfferOfVendorPageResponse | undefined,
): OffersSheetState {
  if (page === undefined) return { kind: 'not-read' };
  if (page.totalElements === 0) return { kind: 'none' };
  if (page.content.length === 0)
    return { kind: 'past-the-end', totalPages: page.totalPages };
  return { kind: 'listed', page };
}
