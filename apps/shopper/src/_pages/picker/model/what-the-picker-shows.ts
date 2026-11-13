import type { VisiblePartPageResponse } from '@pcp/api-client';

import { choicesOn, type PickerQuery } from '@/features/search-parts';
import { whatAPageShows } from '@/shared/lib';

// What the sentence under the picker's title counts (DESIGN.md's The
// picker, Its sheet): the Parts in stock, for an empty Build, which every
// Part fits; the Parts in stock that fit the Build, with the switch off or
// when every Part fits it; or, with the switch on, every Part in stock and
// how many of them do not fit.
export type PickerSays =
  | { kind: 'in-stock'; count: number }
  | { kind: 'fit'; count: number }
  | { kind: 'some-do-not-fit'; count: number; notFit: number };

// What the picker's sheet shows: a page of its list, with what its sentence
// counts, or why it lists nothing.
export type PickerState =
  | { kind: 'listed'; page: VisiblePartPageResponse; says: PickerSays }
  | { kind: 'none-in-stock' }
  | { kind: 'no-match' }
  | { kind: 'none-fits'; inStock: number }
  | { kind: 'past-the-end'; totalPages: number }
  | { kind: 'not-read' };

// What the picker's sheet shows (DESIGN.md's The picker, The empty states),
// from the page of its list the API answered and its query. A list judged
// against a Build that holds a Part answers, in the same statement, how many
// of the Parts it judged are Compatible with it and how many are not,
// whichever way the switch is, so that its four ways of listing nothing are
// told apart in words, from one answer, and a Shopper knows what to change:
//
// - a Category no Vendor has in stock: nothing in stock, and no choice on;
// - a search or filters that found nothing in stock, fitting or not;
// - a list where every Part in stock is not Compatible with the Build: the
//   switch off leaves nothing, though some Part is in stock, and the sheet
//   offers the switch, saying how many it would show;
// - a page past the last, as an old link may ask.
//
// A list the API did not answer cannot be read.
export function whatThePickerShows(
  page: VisiblePartPageResponse | undefined,
  query: PickerQuery,
): PickerState {
  const shown = whatAPageShows(page);
  const notFit = page?.notCompatibleCount ?? 0;

  switch (shown.kind) {
    case 'not-read':
    case 'past-the-end':
      return shown;
    case 'none':
      if (!query.showAll && notFit > 0) return { kind: 'none-fits', inStock: notFit };
      return { kind: choicesOn(query).length === 0 ? 'none-in-stock' : 'no-match' };
    case 'listed': {
      const count = shown.page.totalElements;
      if (shown.page.compatibleCount === undefined) {
        return { ...shown, says: { kind: 'in-stock', count } };
      }
      return {
        ...shown,
        says:
          query.showAll && notFit > 0
            ? { kind: 'some-do-not-fit', count, notFit }
            : { kind: 'fit', count },
      };
    }
  }
}
