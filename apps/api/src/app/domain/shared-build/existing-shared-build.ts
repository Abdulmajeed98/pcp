import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { sharedBuildNotFound } from './shared-build-errors';
import { SharedBuild } from './SharedBuild';

// The Shared Build a store gave back, or `SHARED_BUILD_NOT_FOUND` when it
// gave none, as for an identifier that names none or a text that is not one.
// Every use case that names a Shared Build by its identifier refuses such a
// one alike, as `existingVendor` refuses a Vendor that does not exist.
export function existingSharedBuild(
  sharedBuildId: string,
  found: Either.Either<Option.Option<SharedBuild>, StructuredError>,
): Either.Either<SharedBuild, StructuredError> {
  return Either.flatMap(found, (sharedBuild) =>
    Either.fromOption(sharedBuild, () => sharedBuildNotFound(sharedBuildId)),
  );
}
