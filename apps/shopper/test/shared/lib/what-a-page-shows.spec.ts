import type {
  VisibleOfferOfVendorPageResponse,
  VisibleOfferOfVendorResponse,
} from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whatAPageShows } from '@/shared/lib';

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

// What a sheet that lists a page shows, from what the API answered, here a
// page of a Vendor's Offers (DESIGN.md's Its Offers): the page; or that
// there is none to show, as a Vendor with no Visible Offer has, while its
// contact details still show how to reach it; or how many pages the list
// has, when the page asked is past the last; or that the list cannot be
// read just now. A Category's sheet tells its empty list apart further, by
// the Shopper's choices.
describe('what a sheet that lists a page shows', () => {
  it('shows the page when it holds some', () => {
    const page = aPage([anOffer]);
    expect(whatAPageShows(page)).toEqual({ kind: 'listed', page });
  });

  it('says there is none to show when the whole list holds nothing', () => {
    expect(whatAPageShows(aPage([]))).toEqual({ kind: 'none' });
  });

  it('says how many pages the list has when the page asked is past its last', () => {
    expect(
      whatAPageShows(aPage([], { totalElements: 23, totalPages: 2, pageNumber: 4 })),
    ).toEqual({ kind: 'past-the-end', totalPages: 2 });
  });

  it('says the list cannot be read when the API did not answer it', () => {
    expect(whatAPageShows(undefined)).toEqual({ kind: 'not-read' });
  });
});
