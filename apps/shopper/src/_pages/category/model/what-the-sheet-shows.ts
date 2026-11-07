import type { VisiblePartPageResponse } from '@pcp/api-client';

import { type CategoryQuery, choicesOn } from '@/features/search-parts';
import { type PageShown, whatAPageShows } from '@/shared/lib';

// What a Category's sheet shows: the page of its list, or why it lists
// nothing.
export type SheetState =
  | Exclude<PageShown<VisiblePartPageResponse>, { kind: 'none' }>
  | { kind: 'none-yet' }
  | { kind: 'no-match' };

// What a Category's sheet shows, from the page of its list the API answered
// and the query its address holds (DESIGN.md's The empty states): the list
// when the page holds Parts; that no Vendor offers one yet when the Category
// has no Visible Part at all; that nothing matches when a search or filters
// found nothing; how many pages the list has when the page asked is past its
// last; and that the list cannot be read when the API answered nothing
// (`whatAPageShows`). The two empty lists are told apart, so that a Shopper
// knows whether a choice of theirs emptied it.
export function whatTheSheetShows(
  page: VisiblePartPageResponse | undefined,
  query: CategoryQuery,
): SheetState {
  const shown = whatAPageShows(page);
  if (shown.kind !== 'none') return shown;
  return { kind: choicesOn(query).length === 0 ? 'none-yet' : 'no-match' };
}
