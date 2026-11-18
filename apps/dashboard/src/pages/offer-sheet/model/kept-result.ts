import type { OfferSheetResultResponse } from '@pcp/api-client';
import { useSyncExternalStore } from 'react';

// An upload's result, as the screen keeps it for the visit (the spec's The
// Vendor portal): the API's answer, the name of the file it answered, and
// the rows the Vendor has since asked to be added, by their row numbers.
export interface KeptResult {
  result: OfferSheetResultResponse;
  fileName: string;
  asked: ReadonlySet<number>;
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

// A row of the result was asked to be added, by a Part Request sent from it.
export function rowAskedFor(vendorId: string, row: number): void {
  const now = kept.get(vendorId);
  if (now === undefined) return;
  kept.set(vendorId, { ...now, asked: new Set([...now.asked, row]) });
  changed();
}
