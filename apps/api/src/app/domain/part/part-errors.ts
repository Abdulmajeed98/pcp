import { NotFoundError } from '@pcp/core';

// The error for a Part that does not exist, the same for every use case.
export function partNotFound(partId: string): NotFoundError {
  return NotFoundError.of('PART_NOT_FOUND', `There is no Part ${partId}`);
}
