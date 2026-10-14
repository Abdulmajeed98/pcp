// Where Parts' photos are served, on this API. A frontend puts the API's own
// address in front of a photo's path. A replaced photo has a new identifier,
// and so a new path, which is what lets a photo be cached for a year.
export const photosPath = 'v1/photos';

export function photoPathOf(photoId: string | null): string | null {
  return photoId === null ? null : `/${photosPath}/${photoId}`;
}
