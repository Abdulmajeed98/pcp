import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';

import type { Category } from '@/entities/category';

// The first page of a Category's list as the API answered it, or nothing
// when it did not answer.
export interface FirstPage {
  category: Category;
  page: VisiblePartPageResponse | undefined;
}

// The one Part on the home page's square plate (DESIGN.md's One Part, on the
// plate): the data's choice, never a hand's or a Vendor's, the Visible Part
// with the most Vendors on the first page of the eight lists. Of several
// with as many, the first in the catalog's order of the Categories and then
// in its list's order, so that every visit makes the same choice from the
// same data. None when no list holds a Part.
export function thePlatesPart(
  firstPages: readonly FirstPage[],
): VisiblePartResponse | undefined {
  let chosen: VisiblePartResponse | undefined;
  for (const { page } of firstPages) {
    for (const part of page?.content ?? []) {
      if (chosen === undefined || part.vendorCount > chosen.vendorCount) chosen = part;
    }
  }
  return chosen;
}
