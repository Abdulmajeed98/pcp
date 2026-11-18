import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { partRequestNotFound } from './part-request-errors';
import { PartRequestAndOffer } from './PartRequest';

// The Part Request a store gave back, with the Vendor's Offer for its Part
// now when it was fulfilled, or `PART_REQUEST_NOT_FOUND` when it gave none,
// as for an identifier that names none or a text that is not one. Every use
// case that names a Part Request refuses such a one alike.
export function existingPartRequest(
  partRequestId: string,
  found: Either.Either<Option.Option<PartRequestAndOffer>, StructuredError>,
): Either.Either<PartRequestAndOffer, StructuredError> {
  return Either.flatMap(found, (partRequest) =>
    Either.fromOption(partRequest, () => partRequestNotFound(partRequestId)),
  );
}
