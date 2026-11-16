import { NotFoundError, NotValidError } from '@pcp/core';

// The error for a Shared Build that does not exist, the same for every use
// case, and for a text that is not an identifier.
export function sharedBuildNotFound(sharedBuildId: string): NotFoundError {
  return NotFoundError.of(
    'SHARED_BUILD_NOT_FOUND',
    `There is no Shared Build ${sharedBuildId}`,
  );
}

// A Build with no Part the catalog holds, refused naming `part`, as a Build's
// other refusals are, so that no Shared Build is empty.
export function emptyBuildRefused(): NotValidError {
  return NotValidError.of('NOT_VALID', 'A Build with no Part cannot be shared', {
    field: 'part',
    reason: 'empty',
  });
}
