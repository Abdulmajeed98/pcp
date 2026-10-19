import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Vendor } from './Vendor';
import { vendorNotFound } from './vendor-errors';

// The Vendor a store gave back, or `VENDOR_NOT_FOUND` when it gave none, as
// for a read or a change of a Vendor that does not exist. Every use case
// that names a Vendor by its identifier refuses such a Vendor alike.
export function existingVendor(
  vendorId: string,
  found: Either.Either<Option.Option<Vendor>, StructuredError>,
): Either.Either<Vendor, StructuredError> {
  return Either.flatMap(found, (vendor) =>
    Either.fromOption(vendor, () => vendorNotFound(vendorId)),
  );
}
