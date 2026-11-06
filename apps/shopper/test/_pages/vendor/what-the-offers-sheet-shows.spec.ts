import type {
  VisibleOfferOfVendorPageResponse,
  VisibleOfferOfVendorResponse,
} from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whatTheOffersSheetShows } from '@/_pages/vendor';

const anOffer: VisibleOfferOfVendorResponse = {
  usdPrice: '189.00',
  iqdPrice: 298_000,
  shownPrice: { currency: 'IQD', amount: '298000', converted: false },
  inStock: true,
  warrantyMonths: 12,
  confirmedAt: '2026-11-06T08:00:00.000Z',
  daysSinceConfirmation: 0,
  part: {
    id: '00000000-0000-4000-8000-000000000011',
    category: 'cpu',
    name: 'AMD Ryzen 5 7600X',
    manufacturer: 'AMD',
    partNumbers: ['100-100000593WOF'],
    photoPath: null,
  },
};

// A page of a Vendor's Offers as the API answers it, counted from 0.
function aPage(
  content: VisibleOfferOfVendorResponse[],
  { totalElements = content.length, totalPages = 1, pageNumber = 0 } = {},
): VisibleOfferOfVendorPageResponse {
  return {
    pageNumber,
    pageSize: 20,
    totalElements,
    totalPages,
    first: pageNumber === 0,
    last: pageNumber >= totalPages - 1,
    content,
  };
}

// What the sheet of a Vendor's Offers shows, from what the API answered
// (DESIGN.md's Its Offers): the page of its Offers; or that the Vendor has
// none to show now, while its contact details still show how to reach it;
// or how many pages its list has, when the page asked is past the last; or
// that the Offers cannot be read just now.
describe("what the sheet of a Vendor's Offers shows", () => {
  it('shows the Offers when the page holds some', () => {
    const page = aPage([anOffer]);
    expect(whatTheOffersSheetShows(page)).toEqual({ kind: 'listed', page });
  });

  it('says the Vendor has no Offer to show now when it has no Visible Offer at all', () => {
    expect(whatTheOffersSheetShows(aPage([]))).toEqual({ kind: 'none' });
  });

  it('says how many pages the list has when the page asked is past its last', () => {
    expect(
      whatTheOffersSheetShows(
        aPage([], { totalElements: 23, totalPages: 2, pageNumber: 4 }),
      ),
    ).toEqual({ kind: 'past-the-end', totalPages: 2 });
  });

  it('says the Offers cannot be read when the API did not answer them', () => {
    expect(whatTheOffersSheetShows(undefined)).toEqual({ kind: 'not-read' });
  });
});
