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

// What the API answered the picker: the page of its list that its address
// asks for (`page`), and, when the sheet needs it (`asksTheOtherWay`), how
// many Parts the list holds with the switch the other way (`otherWay`):
// every Part in stock when the switch is off, and those that fit when it is
// on. Either is nothing when the API did not answer it.
export interface PickerAnswers {
  page: VisiblePartPageResponse | undefined;
  otherWay?: number;
}

// Whether the picker asks for its list with the switch the other way, which
// only a Build that holds a Part judges (`judged`): with the switch on, to
// count those that do not fit; with it off, when the Build leaves the list
// empty, to tell that from a Category no Vendor has in stock.
export function asksTheOtherWay(
  page: VisiblePartPageResponse | undefined,
  query: PickerQuery,
  judged: boolean,
): boolean {
  if (page === undefined || !judged) return false;
  return query.showAll ? page.totalElements > 0 : page.totalElements === 0;
}

// What the picker's sheet shows (DESIGN.md's The picker, The empty states),
// from what the API answered, its query and whether the list was judged
// against a Build that holds a Part. Its four ways of listing nothing are
// told apart in words, so that a Shopper knows what to change:
//
// - a Category no Vendor has in stock: nothing in stock, and no choice on;
// - a search or filters that found nothing in stock, fitting or not;
// - a list where every Part in stock is not Compatible with the Build: the
//   switch off leaves nothing, though some Part is in stock, and the sheet
//   offers the switch, saying how many it would show;
// - a page past the last, as an old link may ask.
//
// A list the API did not answer, or whose count the other way it needed and
// did not answer, cannot be read.
export function whatThePickerShows(
  { page, otherWay }: PickerAnswers,
  query: PickerQuery,
  judged: boolean,
): PickerState {
  if (asksTheOtherWay(page, query, judged) && otherWay === undefined) {
    return { kind: 'not-read' };
  }
  const shown = whatAPageShows(page);

  switch (shown.kind) {
    case 'not-read':
    case 'past-the-end':
      return shown;
    case 'none':
      if (judged && !query.showAll && otherWay !== undefined && otherWay > 0) {
        return { kind: 'none-fits', inStock: otherWay };
      }
      return { kind: choicesOn(query).length === 0 ? 'none-in-stock' : 'no-match' };
    case 'listed': {
      const count = shown.page.totalElements;
      if (!judged) return { ...shown, says: { kind: 'in-stock', count } };
      const notFit = query.showAll ? count - (otherWay ?? count) : 0;
      return {
        ...shown,
        says:
          notFit > 0 ? { kind: 'some-do-not-fit', count, notFit } : { kind: 'fit', count },
      };
    }
  }
}
