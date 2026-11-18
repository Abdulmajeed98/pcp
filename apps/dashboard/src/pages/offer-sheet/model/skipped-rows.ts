import type { SkippedRowResponse } from '@pcp/api-client';

import { type OfferDetailRefusal, offerDetailRefusalOf } from '@/entities/offer';

export type Problem = SkippedRowResponse['problem'];

// The four problems, in the order the Vendor can act on them: what the
// Admin can add, what the catalog search settles, and what only the file
// can correct (DESIGN.md's upload's result, the owner's d3).
export const problems: readonly Problem[] = [
  'noPart',
  'severalParts',
  'samePart',
  'notValid',
];

// The skipped rows of one problem, by row number, as the API orders them.
export interface SkippedGroup {
  problem: Problem;
  rows: SkippedRowResponse[];
}

// The skipped rows grouped by problem, in the problems' order, each group
// that holds a row.
export function groupsOf(skipped: readonly SkippedRowResponse[]): SkippedGroup[] {
  return problems
    .map((problem) => ({ problem, rows: skipped.filter((row) => row.problem === problem) }))
    .filter(({ rows }) => rows.length > 0);
}

// How many rows a group shows at first, and how many each "Show 50 more"
// adds, so that a phone never draws thousands of rows (the owner's d4).
export const rowsShownFirst = 10;
export const rowsShownMore = 50;

// Why a cell does not fit, by its message's key in the dashboard's text: the
// Offer's details as the Offer form says them (`OfferForm.refused`), and the
// sheet's own, a part number missing or too long, a word that is not yes or
// no and a cell that cannot be read (`OfferSheetScreen.cell`).
export type CellRefusal =
  | `OfferForm.refused.${OfferDetailRefusal}`
  | `OfferSheetScreen.cell.${'partNumberMissing' | 'partNumberTooLong' | 'notYesOrNo' | 'notReadable'}`;

export function cellRefusalOf({
  field,
  reason,
}: Pick<SkippedRowResponse, 'field' | 'reason'>): CellRefusal {
  if (reason === 'notReadable') return 'OfferSheetScreen.cell.notReadable';
  if (reason === 'notYesOrNo') return 'OfferSheetScreen.cell.notYesOrNo';
  if (field === 'partNumber') {
    return reason === 'tooLong'
      ? 'OfferSheetScreen.cell.partNumberTooLong'
      : 'OfferSheetScreen.cell.partNumberMissing';
  }
  const refused = offerDetailRefusalOf({
    code: 'NOT_VALID',
    title: '',
    detail: '',
    additionalInformation: { field: field ?? '', reason: reason ?? '' },
  });
  return `OfferForm.refused.${(refused?.message ?? 'other') as OfferDetailRefusal}`;
}
