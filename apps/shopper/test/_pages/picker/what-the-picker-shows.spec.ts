import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whatThePickerShows } from '@/_pages/picker';
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
// holds, how many pages it has, and the page's Parts; and, for a list judged
// against a Build that holds a Part, how many of the Parts it judged are
// Compatible with it and how many are not.
function aPage(
  totalElements: number,
  content: VisiblePartResponse[],
  {
    totalPages = Math.max(1, Math.ceil(totalElements / 20)),
    judged,
  }: { totalPages?: number; judged?: { compatible: number; notCompatible: number } } = {},
): VisiblePartPageResponse {
  return {
    content,
    ...(judged === undefined
      ? {}
      : { compatibleCount: judged.compatible, notCompatibleCount: judged.notCompatible }),
    totalElements,
    totalPages,
    pageNumber: 0,
    pageSize: 20,
    first: true,
    last: totalPages <= 1,
  };
}

const nothing = aPage(0, [], { totalPages: 0 });
// Nothing listed of a list judged against a Build.
const nothingJudged = (compatible: number, notCompatible: number) =>
  aPage(0, [], { totalPages: 0, judged: { compatible, notCompatible } });

// What the picker's sheet says (DESIGN.md's The picker, The empty states):
// its list, or why it lists nothing, told apart in words so that a Shopper
// knows what to change. The picker lists in stock only and, once the Build
// holds a Part, only what is Compatible with it, unless the switch shows
// every Part. A list
// judged against such a Build says, in the one answer, how many of the Parts
// it judged are Compatible and how many are not, which tells a Build that
// leaves nothing from a Category no Vendor has in stock.
describe("what the picker's sheet shows", () => {
  describe('a Category no Vendor has in stock', () => {
    it('is told by an empty list with nothing on, for an empty Build', () => {
      expect(whatThePickerShows(nothing, aPickerQuery({}))).toEqual({
        kind: 'none-in-stock',
      });
    });

    it('is told by an empty list with nothing on, whichever way the switch is', () => {
      expect(whatThePickerShows(nothingJudged(0, 0), aPickerQuery({}))).toEqual({
        kind: 'none-in-stock',
      });
      expect(
        whatThePickerShows(nothingJudged(0, 0), aPickerQuery({ showAll: true })),
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
      expect(whatThePickerShows(nothingJudged(0, 0), query)).toEqual({ kind: 'no-match' });
      expect(whatThePickerShows(nothing, query)).toEqual({ kind: 'no-match' });
    });
  });

  describe('a list where every Part in stock is not Compatible', () => {
    it('is told by a list the Build empties while some Part is in stock, offering the switch with how many', () => {
      expect(whatThePickerShows(nothingJudged(0, 7), aPickerQuery({}))).toEqual({
        kind: 'none-compatible',
        inStock: 7,
      });
    });

    it('is told so with a search on too, which found Parts that are not Compatible', () => {
      expect(
        whatThePickerShows(nothingJudged(0, 2), aPickerQuery({ search: 'ryzen 9' })),
      ).toEqual({ kind: 'none-compatible', inStock: 2 });
    });
  });

  describe('a page past the last', () => {
    it('says how many pages the list has, whichever way the switch is', () => {
      expect(
        whatThePickerShows(
          aPage(45, [], { totalPages: 3, judged: { compatible: 45, notCompatible: 0 } }),
          aPickerQuery({ page: 9 }),
        ),
      ).toEqual({ kind: 'past-the-end', totalPages: 3 });
      expect(
        whatThePickerShows(
          aPage(45, [], { totalPages: 3, judged: { compatible: 30, notCompatible: 15 } }),
          aPickerQuery({ page: 9, showAll: true }),
        ),
      ).toEqual({ kind: 'past-the-end', totalPages: 3 });
    });
  });

  describe('a page of the list', () => {
    it('counts the Parts in stock for an empty Build, with which every Part is Compatible', () => {
      const listed = aPage(3, [aCpu('1'), aCpu('2'), aCpu('3')]);
      expect(whatThePickerShows(listed, aPickerQuery({}))).toEqual({
        kind: 'listed',
        page: listed,
        says: { kind: 'in-stock', count: 3 },
      });
    });

    it('counts the Parts Compatible with the Build with the switch off', () => {
      const listed = aPage(3, [aCpu('1', true), aCpu('2', true), aCpu('3', true)], {
        judged: { compatible: 3, notCompatible: 5 },
      });
      expect(whatThePickerShows(listed, aPickerQuery({}))).toEqual({
        kind: 'listed',
        page: listed,
        says: { kind: 'compatible', count: 3 },
      });
    });

    it('counts every Part in stock and those that are not Compatible with the switch on', () => {
      const every = aPage(8, [aCpu('1', true), aCpu('2', false)], {
        judged: { compatible: 3, notCompatible: 5 },
      });
      expect(whatThePickerShows(every, aPickerQuery({ showAll: true }))).toEqual({
        kind: 'listed',
        page: every,
        says: { kind: 'some-not-compatible', count: 8, notCompatible: 5 },
      });
    });

    it('counts the Parts Compatible with the Build with the switch on when every Part is', () => {
      const listed = aPage(3, [aCpu('1', true), aCpu('2', true), aCpu('3', true)], {
        judged: { compatible: 3, notCompatible: 0 },
      });
      expect(whatThePickerShows(listed, aPickerQuery({ showAll: true }))).toEqual({
        kind: 'listed',
        page: listed,
        says: { kind: 'compatible', count: 3 },
      });
    });
  });

  describe('a list the API did not answer', () => {
    it('cannot be read', () => {
      expect(whatThePickerShows(undefined, aPickerQuery({}))).toEqual({
        kind: 'not-read',
      });
    });
  });
});
