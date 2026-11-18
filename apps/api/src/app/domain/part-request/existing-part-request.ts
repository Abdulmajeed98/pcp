import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Part } from '../part/Part';
import { partNotFound } from '../part/part-errors';
import { PartStore } from '../part/PartStore';
import { partRequestNotFound, partRequestResolved } from './part-request-errors';
import { PartRequest, PartRequestAndOffer } from './PartRequest';
import { PartRequestStore } from './PartRequestStore';

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

// The open Part Request and the Part that fulfilling it names, or the
// refusal a fulfilment gives, in the spec's order: the request, whether it
// is still open, then the Part. Fulfilling a request, and reading what
// fulfilling it would do, refuse alike.
export async function toFulfil(
  partRequestStore: PartRequestStore,
  partStore: PartStore,
  partRequestId: string,
  partId: string,
): Promise<Either.Either<{ partRequest: PartRequest; part: Part }, StructuredError>> {
  const found = existingPartRequest(
    partRequestId,
    await partRequestStore.readById(partRequestId),
  );
  if (Either.isLeft(found)) return Either.left(found.left);
  const partRequest = found.right.getPartRequest();
  if (!partRequest.isOpen()) return Either.left(partRequestResolved(partRequestId));

  const part = await partStore.readById(partId);
  if (Either.isLeft(part)) return Either.left(part.left);
  if (Option.isNone(part.right)) return Either.left(partNotFound(partId));
  return Either.right({ partRequest, part: part.right.value });
}
