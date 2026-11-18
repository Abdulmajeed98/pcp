import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { OfferStore } from '../offer/OfferStore';
import { partRequestNotFound } from './part-request-errors';
import { PartRequest, PartRequestAndOffer } from './PartRequest';

// The Part Request a store gave back, or `PART_REQUEST_NOT_FOUND` when it
// gave none, as for an identifier that names none or a text that is not
// one. Every use case that names a Part Request refuses such a one alike.
export function existingPartRequest(
  partRequestId: string,
  found: Either.Either<Option.Option<PartRequest>, StructuredError>,
): Either.Either<PartRequest, StructuredError> {
  return Either.flatMap(found, (partRequest) =>
    Either.fromOption(partRequest, () => partRequestNotFound(partRequestId)),
  );
}

// The Part Request with the Vendor's Offer for its Part now, which the Offer
// Store finds by the Part, when it was fulfilled: none once the Vendor has
// removed it. An open or a rejected request has no Part to find one for.
export async function withTheVendorsOffer(
  partRequest: PartRequest,
  offerStore: OfferStore,
): Promise<Either.Either<PartRequestAndOffer, StructuredError>> {
  const part = partRequest.getPart();
  if (part === null) return Either.right(new PartRequestAndOffer(partRequest, null));

  const offer = await offerStore.readByPart(partRequest.getVendor().getId(), part.getId());
  return Either.map(
    offer,
    (found) =>
      new PartRequestAndOffer(
        partRequest,
        Option.getOrNull(Option.map(found, (each) => each.getId())),
      ),
  );
}
