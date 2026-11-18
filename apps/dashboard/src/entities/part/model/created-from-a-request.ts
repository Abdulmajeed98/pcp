// What the form for a new Part opened from a Part Request leaves in the
// address's state after it creates the Part and fulfils the request with
// it, for the Part's page it leads to, whose note says so: the request's
// name as the Vendor wrote it, the Vendor's name as it writes it, the Part's
// name as the catalog holds it, and what the fulfilment did to the Vendor's
// Offer for the Part, as the API answered it (part-requests ticket 04).
export interface PartCreatedFromARequest {
  createdFrom: {
    requestName: string;
    vendorName: string;
    partName: string;
    offer: 'created' | 'replaced' | 'kept';
  };
}

// What the address's state holds for the Part's page, if the form left it.
export function createdFromARequestIn(
  state: unknown,
): PartCreatedFromARequest['createdFrom'] | null {
  return (state as Partial<PartCreatedFromARequest> | null)?.createdFrom ?? null;
}
