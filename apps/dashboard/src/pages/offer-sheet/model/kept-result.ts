import type { OfferSheetResultResponse } from '@pcp/api-client';
import { useSyncExternalStore } from 'react';

// An upload's result, as the screen keeps it for the visit (the spec's The
// Vendor portal): the API's answer, the name of the file it answered, and
// the part numbers the Vendor has since asked to be added, from a row of
// the result, each folded as the API compares them, so that every row of
// one part number is asked for once (the code review of `sheet`).
export interface KeptResult {
  result: OfferSheetResultResponse;
  fileName: string;
  asked: ReadonlySet<string>;
  // Whether it was never yet shown: the page then moves to its head, which
  // takes the focus, so that a phone sees what happened (Motion 13).
  fresh: boolean;
  // Whether it is the visit's first, which arrives as a row does, its space
  // opening and then its fade; a later upload's result replaces it in
  // place, at once (Motion 9).
  arrives: boolean;
}

// Each Vendor's last result, kept in the page and nowhere else: it is never
// stored by the API, so a reload loses it, and uploading the same file again
// shows it again and changes nothing (the spec). It outlives the screen,
// so that the Part Request form opened from a row, a screen of its own, and
// any other screen of the portal can be left for and come back to it. The
// Admin acting as one Vendor after another keeps each Vendor's apart.
const kept = new Map<string, KeptResult>();
const listeners = new Set<() => void>();

function changed(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The Vendor's result kept for the visit, if an upload has answered one.
export function useKeptResult(vendorId: string): KeptResult | undefined {
  return useSyncExternalStore(subscribe, () => kept.get(vendorId));
}

// Keeps an upload's result, in place of the one before it.
export function keepTheResult(
  vendorId: string,
  result: OfferSheetResultResponse,
  fileName: string,
): void {
  kept.set(vendorId, {
    result,
    fileName,
    asked: new Set(),
    fresh: true,
    arrives: !kept.has(vendorId),
  });
  changed();
}

// The result has been shown: from now on it is drawn at once, where it is.
export function resultShown(vendorId: string, result: OfferSheetResultResponse): void {
  const now = kept.get(vendorId);
  if (now?.result !== result || !now.fresh) return;
  kept.set(vendorId, { ...now, fresh: false, arrives: false });
  changed();
}

// A part number as the API compares a row's with an open Part Request's.
// The API's fold, `foldedPartNumber`, is the rule that counts: the number
// cleaned as the catalog cleans one, then in lower case. A row that matched
// no Part is answered with its number already cleaned, so lower case is all
// that is left to do here.
function folded(partNumber: string): string {
  return partNumber.toLowerCase();
}

// Whether a row's part number was asked to be added, from that row or from
// another row of the same number.
export function isAskedFor(kept: KeptResult, partNumber: string): boolean {
  return kept.asked.has(folded(partNumber));
}

// A row's part number was asked to be added, by a Part Request sent from
// the row: every row of that number is then asked for.
export function partNumberAskedFor(vendorId: string, partNumber: string): void {
  const now = kept.get(vendorId);
  if (now === undefined) return;
  kept.set(vendorId, { ...now, asked: new Set([...now.asked, folded(partNumber)]) });
  changed();
}
