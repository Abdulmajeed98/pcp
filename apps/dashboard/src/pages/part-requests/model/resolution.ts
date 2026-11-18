import type { FulfilledPartRequestResponse } from '@pcp/api-client';

// What became of a Part Request the Admin resolved: fulfilled, with what the
// fulfilment did to the Vendor's Offer for the Part, as the API answers it,
// or rejected.
export type Outcome = FulfilledPartRequestResponse['offer'] | 'rejected';

// What a resolution leaves in the address's state for the queue it returns
// to, whose note names the request and says what became of it: the
// request's name as the Vendor wrote it, the Vendor's name as it writes it,
// and, for a fulfilment, the catalog's name of the Part.
export interface Resolved {
  resolved: {
    requestId: string;
    requestName: string;
    vendorName: string;
    partName?: string;
    outcome: Outcome;
  };
}

// What the address's state holds for the queue, if a resolution left it.
export function resolvedIn(state: unknown): Resolved['resolved'] | null {
  const resolved = (state as Partial<Resolved> | null)?.resolved;
  return resolved === undefined ? null : resolved;
}
