import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whatTheSheetShows } from '@/_pages/category';

const aPart: VisiblePartResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  category: 'cpu',
  name: 'AMD Ryzen 5 7600X',
  manufacturer: 'AMD',
  partNumbers: ['100-100000593WOF'],
  photoPath: null,
  lowestPrice: { currency: 'IQD', amount: '298000', converted: false },
  vendorCount: 1,
  inStock: true,
};

// A page of a Category's list as the API answers it, with its first page
// counted from 0.
function aPage(
  content: VisiblePartResponse[],
  { totalElements = content.length, totalPages = 1, pageNumber = 0 } = {},
): VisiblePartPageResponse {
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

// What a Category's sheet shows, from what the API answered and what the
// address asked (DESIGN.md's The empty states): its list, or why it lists
// nothing. A Category no Vendor offers yet and a search that found nothing
// are told apart, so that a Shopper knows whether to search again.
describe("what a Category's sheet shows", () => {
  it('shows the list when the page holds Parts', () => {
    const page = aPage([aPart]);
    expect(whatTheSheetShows(page, { search: '', page: 1 })).toEqual({
      kind: 'listed',
      page,
    });
  });

  it('says that no Vendor offers one yet when the Category has no Visible Part at all', () => {
    expect(whatTheSheetShows(aPage([]), { search: '', page: 1 })).toEqual({
      kind: 'none-yet',
    });
  });

  it('says that nothing matches when a search found nothing', () => {
    expect(whatTheSheetShows(aPage([]), { search: 'rtx 9090', page: 1 })).toEqual({
      kind: 'no-match',
    });
  });

  // A page past the last of a list that holds Parts is neither empty list.
  it('says the list has fewer pages when the page is past its last', () => {
    expect(
      whatTheSheetShows(aPage([], { totalElements: 25, totalPages: 2, pageNumber: 6 }), {
        search: '',
        page: 7,
      }),
    ).toEqual({ kind: 'past-the-end', totalPages: 2 });
  });

  it('says the list cannot be read when the API answered nothing', () => {
    expect(whatTheSheetShows(undefined, { search: 'ryzen', page: 1 })).toEqual({
      kind: 'not-read',
    });
  });
});
