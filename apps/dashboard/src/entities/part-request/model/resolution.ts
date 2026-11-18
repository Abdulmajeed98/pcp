import type { FulfilledPartRequestResponse } from '@pcp/api-client';

// What a fulfilment did to the Vendor's Offer for the Part, as the API
// answers it.
export type OfferFulfilment = FulfilledPartRequestResponse['offer'];

// What became of a Part Request the Admin resolved, as the note after it
// says it: the request's name as the Vendor wrote it and the Vendor's name
// as it writes it, then, for a fulfilment, the catalog's name of the Part
// and what the fulfilment did to the Vendor's Offer for it; or that it was
// rejected. The queue the Admin returns to after a resolution, and the new
// Part's page after Create the Part, carry it in the address's state.
export type Resolution =
  | { requestName: string; vendorName: string; outcome: 'rejected' }
  | {
      requestName: string;
      vendorName: string;
      partName: string;
      outcome: OfferFulfilment;
    };

// A resolution that fulfilled the request.
export type Fulfilment = Extract<Resolution, { partName: string }>;

// What the form for a new Part opened from a Part Request leaves in the
// address's state after it creates the Part and fulfils the request with
// it, for the Part's page it leads to, whose note says so (part-requests
// ticket 04).
export interface PartCreatedFromARequest {
  createdFrom: Fulfilment;
}

// What the address's state holds for the Part's page, if the form left it.
export function createdFromARequestIn(state: unknown): Fulfilment | null {
  return (state as Partial<PartCreatedFromARequest> | null)?.createdFrom ?? null;
}
