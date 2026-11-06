import type { VisiblePartPageResponse } from '@pcp/api-client';

import { type CategoryQuery, choicesOn } from '@/features/search-parts';

// What a Category's sheet shows: the page of its list, or why it lists
// nothing.
export type SheetState =
  | { kind: 'listed'; page: VisiblePartPageResponse }
  | { kind: 'none-yet' }
  | { kind: 'no-match' }
  | { kind: 'past-the-end'; totalPages: number }
  | { kind: 'not-read' };

// What a Category's sheet shows, from the page of its list the API answered
// and the query its address holds (DESIGN.md's The empty states): the list
// when the page holds Parts; that no Vendor offers one yet when the Category
// has no Visible Part at all; that nothing matches when a search or filters
// found nothing; how many pages the list has when the page asked is past its
// last; and that the list cannot be read when the API answered nothing. The
// two empty lists are told apart, so that a Shopper knows whether a choice of
// theirs emptied it.
export function whatTheSheetShows(
  page: VisiblePartPageResponse | undefined,
  query: CategoryQuery,
): SheetState {
  if (page === undefined) return { kind: 'not-read' };
  if (page.totalElements === 0) {
    return { kind: choicesOn(query).length === 0 ? 'none-yet' : 'no-match' };
  }
  if (page.content.length === 0)
    return { kind: 'past-the-end', totalPages: page.totalPages };
  return { kind: 'listed', page };
}
