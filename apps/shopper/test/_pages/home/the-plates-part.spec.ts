import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { thePlatesPart } from '@/_pages/home';

function aPart(
  id: string,
  category: VisiblePartResponse['category'],
  vendorCount: number,
): VisiblePartResponse {
  return {
    id,
    category,
    name: `Made-up Part ${id}`,
    manufacturer: 'Made-up Parts',
    partNumbers: [],
    photoPath: null,
    lowestPrice: { currency: 'IQD', amount: '100000', converted: false },
    vendorCount,
    inStock: true,
  };
}

function aFirstPage(...content: VisiblePartResponse[]): VisiblePartPageResponse {
  return {
    pageNumber: 0,
    pageSize: 10,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    content,
  };
}

// The square plate shows one Part: the data's choice, never a hand's, the
// Visible Part with the most Vendors on the first page of the eight lists.
describe("the home page's plate", () => {
  it('shows the Part with the most Vendors on the first pages of the lists', () => {
    const lists = [
      { category: 'cpu', page: aFirstPage(aPart('a', 'cpu', 3), aPart('b', 'cpu', 20)) },
      { category: 'gpu', page: aFirstPage(aPart('c', 'gpu', 12)) },
    ] as const;
    expect(thePlatesPart(lists)?.id).toBe('b');
  });

  // Of two with as many Vendors, the first in the catalog's order of the
  // eight Categories, then in its list's order, so that the choice is the
  // same on every visit.
  it('shows the first of several with as many Vendors', () => {
    const lists = [
      { category: 'cpu', page: aFirstPage(aPart('a', 'cpu', 2), aPart('b', 'cpu', 7)) },
      { category: 'ram', page: aFirstPage(aPart('c', 'ram', 7)) },
    ] as const;
    expect(thePlatesPart(lists)?.id).toBe('b');
  });

  it('passes over a list the API did not answer', () => {
    const lists = [
      { category: 'cpu', page: undefined },
      { category: 'psu', page: aFirstPage(aPart('d', 'psu', 1)) },
    ] as const;
    expect(thePlatesPart(lists)?.id).toBe('d');
  });

  it('shows no Part when no list holds one', () => {
    expect(thePlatesPart([{ category: 'case', page: aFirstPage() }])).toBeUndefined();
    expect(thePlatesPart([])).toBeUndefined();
  });
});
