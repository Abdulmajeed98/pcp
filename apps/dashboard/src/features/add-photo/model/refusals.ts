import type { SubErrorResponse } from '@pcp/api-client';

import { Refusal } from '@/shared/api';

// What the Admin is told when the API refuses a photo, by the reason it gave.
const reasons: Record<string, string> = {
  missing: 'No file arrived. Choose the photo again.',
  tooLarge: 'The file is larger than 10 MB. Choose a smaller photo.',
  notAPhoto: 'The file is not a JPEG, PNG or WebP picture. Choose a photo.',
  tooManyPixels:
    'The picture has too many pixels to be made smaller. Choose a smaller photo.',
};

// Why a photo was not added, in plain words.
export function whyNotAdded(error: Error): string {
  if (!(error instanceof Refusal)) {
    return 'The API cannot be reached. Check the connection, and choose the photo again.';
  }

  const reason = error.errors.find(
    (each: SubErrorResponse) => each.additionalInformation?.field === 'photo',
  )?.additionalInformation?.reason;
  return (
    (reason !== undefined ? reasons[reason] : undefined) ??
    `The API refused the photo, with ${error.status}, ${error.code}.`
  );
}
