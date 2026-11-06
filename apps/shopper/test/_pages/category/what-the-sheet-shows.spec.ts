import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whatTheSheetShows } from '@/_pages/category';
import { type CategoryQuery, nothingOn } from '@/features/search-parts';

// A query with nothing on but what a test gives.
function aQuery(on: Partial<CategoryQuery>): CategoryQuery {
  return { ...nothingOn, ...on };
}

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
// nothing. A Category no Vendor offers yet and a search or filters that found
// nothing are told apart, so that a Shopper knows whether to clear them.
describe("what a Category's sheet shows", () => {
  it('shows the list when the page holds Parts', () => {
    const page = aPage([aPart]);
    expect(whatTheSheetShows(page, nothingOn)).toEqual({
      kind: 'listed',
      page,
    });
  });

  it('says that no Vendor offers one yet when the Category has no Visible Part at all', () => {
    expect(whatTheSheetShows(aPage([]), nothingOn)).toEqual({
      kind: 'none-yet',
    });
  });

  it('says that nothing matches when a search found nothing', () => {
    expect(whatTheSheetShows(aPage([]), aQuery({ search: 'rtx 9090' }))).toEqual({
      kind: 'no-match',
    });
  });

  // A list the filters emptied is told apart from a Category no Vendor offers
  // yet, as a search that found nothing is, so that the Shopper is offered to
  // clear them.
  it.each([
    ['a manufacturer', aQuery({ manufacturers: ['AMD'] })],
    [
      'a value of a filter',
      aQuery({ filters: [{ parameter: 'socket', values: ['AM5'] }] }),
    ],
    ['the lowest end of a price range', aQuery({ lowest: 0 })],
    ['the highest end of a price range', aQuery({ highest: 100_000 })],
  ])('says that nothing matches when %s found nothing', (_choice, query) => {
    expect(whatTheSheetShows(aPage([]), query)).toEqual({ kind: 'no-match' });
  });

  // A page past the last of a list that holds Parts is neither empty list.
  it('says the list has fewer pages when the page is past its last', () => {
    expect(
      whatTheSheetShows(
        aPage([], { totalElements: 25, totalPages: 2, pageNumber: 6 }),
        aQuery({ page: 7 }),
      ),
    ).toEqual({ kind: 'past-the-end', totalPages: 2 });
  });

  it('says the list cannot be read when the API answered nothing', () => {
    expect(whatTheSheetShows(undefined, aQuery({ search: 'ryzen' }))).toEqual({
      kind: 'not-read',
    });
  });
});
