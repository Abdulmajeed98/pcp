import { Part } from '~/domain/part/Part';

// Where a Part's photo is served, on this API. A frontend puts the API's own
// address in front of it. A replaced photo has a new identifier, and so a new
// path, which is what lets a photo be cached for a year.
export function photoPathOf(part: Part): string | null {
  const photoId = part.getPhotoId();
  return photoId === null ? null : `/v1/photos/${photoId}`;
}
