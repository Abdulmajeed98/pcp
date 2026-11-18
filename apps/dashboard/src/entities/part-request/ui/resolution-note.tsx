import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { CircleCheckIcon } from 'lucide-react';

import type { OfferFulfilment, Resolution } from '../model/resolution';

// What a fulfilment did to the Vendor's Offer for the Part, as the API
// answered it, in the words that end the note's sentence.
const offerWords: Record<OfferFulfilment, string> = {
  created: 'was made with the request’s details.',
  replaced: 'now has the request’s details, confirmed when the request was sent.',
  kept: 'was kept as it was: the Vendor confirmed it after sending the request.',
};

// The note after a Part Request is resolved, as the dashboard's DESIGN.md
// draws the note after an Offer is added: a Sheet panel with a Confirmed
// Green edge and 8-pixel corners, a circled tick and its title in Confirmed
// Green, then one sentence that names the request and says what became of
// the Vendor's Offer, or that the Vendor reads the reason. A rejection is
// not the Vendor's success, but the note is the Admin's own confirmation
// that it was done, so it is drawn the same way. The request's name and the
// Vendor's are as they were written, and the Part's is the catalog's,
// English. On the queue after a resolution it is titled by how the request
// was resolved; at the head of the new Part's page after Create the Part,
// `partCreated`, it says that the Part was created too. It arrives with the
// screen it is on (Motion 6).
export function ResolutionNote({
  resolution,
  partCreated = false,
}: {
  resolution: Resolution;
  partCreated?: boolean;
}) {
  const request = <AsWritten>{resolution.requestName}</AsWritten>;
  const vendor = <AsWritten>{resolution.vendorName}</AsWritten>;

  return (
    <div
      data-testid="resolution-note"
      className="arrives flex flex-col gap-1 rounded-card border border-success bg-card px-4 py-3 text-sm"
    >
      <span className="flex items-center gap-2 text-base font-semibold text-success">
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
        {resolution.outcome === 'rejected'
          ? 'Request rejected'
          : partCreated
            ? 'Part created and request fulfilled'
            : 'Request fulfilled'}
      </span>
      <span>
        {resolution.outcome === 'rejected' ? (
          <>
            {request} is rejected. {vendor} reads your reason in its portal.
          </>
        ) : (
          <>
            {request} is matched to <AlwaysEnglish>{resolution.partName}</AlwaysEnglish>,
            and {vendor}’s Offer for it {offerWords[resolution.outcome]}
          </>
        )}
      </span>
    </div>
  );
}
