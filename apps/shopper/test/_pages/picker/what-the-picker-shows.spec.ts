import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { asksTheOtherWay, whatThePickerShows } from '@/_pages/picker';
import { nothingOn, type PickerQuery } from '@/features/search-parts';

// A picker's query with nothing on but what a test gives, the switch off.
function aPickerQuery(on: Partial<PickerQuery>): PickerQuery {
  return { ...nothingOn, showAll: false, ...on };
}

// A CPU in stock, as the list answers it, Compatible with the Build or not.
function aCpu(name: string, compatible?: boolean): VisiblePartResponse {
  return {
    id: `00000000-0000-4000-8000-${name.padStart(12, '0')}`,
    category: 'cpu',
    name: `CPU ${name}`,
    manufacturer: 'AMD',
    partNumbers: [],
    photoPath: null,
    vendorCount: 1,
    inStock: true,
    lowestPrice: { currency: 'IQD', amount: '250000', converted: false },
    ...(compatible === undefined ? {} : { compatible }),
  };
}

// A page of the list as the API answers it: how many Parts the whole list
// holds, how many pages it has, and the page's Parts.
function aPage(
  totalElements: number,
  content: VisiblePartResponse[],
  totalPages = Math.max(1, Math.ceil(totalElements / 20)),
): VisiblePartPageResponse {
  return {
    content,
    totalElements,
    totalPages,
    pageNumber: 0,
    pageSize: 20,
    first: true,
    last: totalPages <= 1,
  };
}

const nothing = aPage(0, [], 0);

// What the picker's sheet says (DESIGN.md's The picker, The empty states):
// its list, or why it lists nothing, told apart in words so that a Shopper
// knows what to change. The picker lists in stock only and, once the Build
// holds a Part, only what fits it, unless the switch shows every Part; so a
// list it leaves empty needs the count of the list with the switch the other
// way (`otherWay`) to tell a Build that leaves nothing from a Category no
// Vendor has in stock.
describe("what the picker's sheet shows", () => {
  describe('a Category no Vendor has in stock', () => {
    it('is told by an empty list with nothing on, for an empty Build', () => {
      expect(whatThePickerShows({ page: nothing }, aPickerQuery({}), false)).toEqual({
        kind: 'none-in-stock',
      });
    });

    it('is told by an empty list with nothing on, whichever way the switch is', () => {
      expect(
        whatThePickerShows({ page: nothing, otherWay: 0 }, aPickerQuery({}), true),
      ).toEqual({ kind: 'none-in-stock' });
      expect(
        whatThePickerShows({ page: nothing }, aPickerQuery({ showAll: true }), true),
      ).toEqual({ kind: 'none-in-stock' });
    });
  });

  describe('a search or filters that found nothing', () => {
    it.each([
      ['a search', aPickerQuery({ search: 'ryzen' })],
      ['a filter', aPickerQuery({ filters: [{ parameter: 'socket', values: ['AM5'] }] })],
      ['a price range', aPickerQuery({ highest: 1000 })],
      ['a search with the switch on', aPickerQuery({ search: 'ryzen', showAll: true })],
    ])('is told by an empty list with %s on', (_, query) => {
      expect(whatThePickerShows({ page: nothing, otherWay: 0 }, query, true)).toEqual({
        kind: 'no-match',
      });
      expect(whatThePickerShows({ page: nothing }, query, false)).toEqual({
        kind: 'no-match',
      });
    });
  });

  describe('a list where every Part in stock is not Compatible', () => {
    it('is told by a list the Build empties while some Part is in stock, offering the switch with how many', () => {
      expect(
        whatThePickerShows({ page: nothing, otherWay: 7 }, aPickerQuery({}), true),
      ).toEqual({ kind: 'none-fits', inStock: 7 });
    });

    it('is told so with a search on too, which found Parts that do not fit', () => {
      expect(
        whatThePickerShows(
          { page: nothing, otherWay: 2 },
          aPickerQuery({ search: 'ryzen 9' }),
          true,
        ),
      ).toEqual({ kind: 'none-fits', inStock: 2 });
    });
  });

  describe('a page past the last', () => {
    it('says how many pages the list has, whichever way the switch is', () => {
      expect(
        whatThePickerShows({ page: aPage(45, [], 3) }, aPickerQuery({ page: 9 }), true),
      ).toEqual({ kind: 'past-the-end', totalPages: 3 });
      expect(
        whatThePickerShows(
          { page: aPage(45, [], 3), otherWay: 30 },
          aPickerQuery({ page: 9, showAll: true }),
          true,
        ),
      ).toEqual({ kind: 'past-the-end', totalPages: 3 });
    });
  });

  describe('a page of the list', () => {
    const listed = aPage(3, [aCpu('1'), aCpu('2'), aCpu('3')]);

    it('counts the Parts in stock for an empty Build, which every Part fits', () => {
      expect(whatThePickerShows({ page: listed }, aPickerQuery({}), false)).toEqual({
        kind: 'listed',
        page: listed,
        says: { kind: 'in-stock', count: 3 },
      });
    });

    it('counts the Parts that fit the Build with the switch off', () => {
      expect(whatThePickerShows({ page: listed }, aPickerQuery({}), true)).toEqual({
        kind: 'listed',
        page: listed,
        says: { kind: 'fit', count: 3 },
      });
    });

    it('counts every Part in stock and those that do not fit with the switch on', () => {
      const every = aPage(8, [aCpu('1', true), aCpu('2', false)]);
      expect(
        whatThePickerShows(
          { page: every, otherWay: 3 },
          aPickerQuery({ showAll: true }),
          true,
        ),
      ).toEqual({
        kind: 'listed',
        page: every,
        says: { kind: 'some-do-not-fit', count: 8, notFit: 5 },
      });
    });

    it('counts the Parts that fit with the switch on when every Part fits', () => {
      expect(
        whatThePickerShows(
          { page: listed, otherWay: 3 },
          aPickerQuery({ showAll: true }),
          true,
        ),
      ).toEqual({ kind: 'listed', page: listed, says: { kind: 'fit', count: 3 } });
    });
  });

  describe('a list the API did not answer', () => {
    it('cannot be read', () => {
      expect(whatThePickerShows({ page: undefined }, aPickerQuery({}), true)).toEqual({
        kind: 'not-read',
      });
    });

    it('cannot be read when the count the other way was needed and not answered', () => {
      expect(whatThePickerShows({ page: nothing }, aPickerQuery({}), true)).toEqual({
        kind: 'not-read',
      });
      expect(
        whatThePickerShows(
          { page: aPage(3, [aCpu('1')]) },
          aPickerQuery({ showAll: true }),
          true,
        ),
      ).toEqual({ kind: 'not-read' });
    });
  });
});

// The picker asks for the list the other way only when its sheet needs it:
// with a Build that holds a Part, to count those that do not fit when the
// switch shows every Part, or to tell why a list the Build empties is empty.
describe('whether the picker asks for its list with the switch the other way', () => {
  it('asks with the switch on, to count those that do not fit', () => {
    expect(
      asksTheOtherWay(aPage(8, [aCpu('1')]), aPickerQuery({ showAll: true }), true),
    ).toBe(true);
  });

  it('asks with the switch off when the Build leaves the list empty', () => {
    expect(asksTheOtherWay(nothing, aPickerQuery({}), true)).toBe(true);
  });

  it('does not ask with the switch off when the list holds Parts', () => {
    expect(asksTheOtherWay(aPage(3, [aCpu('1')]), aPickerQuery({}), true)).toBe(false);
  });

  it('does not ask with the switch on when nothing is in stock', () => {
    expect(asksTheOtherWay(nothing, aPickerQuery({ showAll: true }), true)).toBe(false);
  });

  it('does not ask for an empty Build, nor when the API did not answer', () => {
    expect(asksTheOtherWay(nothing, aPickerQuery({ showAll: true }), false)).toBe(false);
    expect(asksTheOtherWay(nothing, aPickerQuery({}), false)).toBe(false);
    expect(asksTheOtherWay(undefined, aPickerQuery({}), true)).toBe(false);
  });
});
