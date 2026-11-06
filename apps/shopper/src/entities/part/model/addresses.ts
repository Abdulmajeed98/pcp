import type { Language } from '@pcp/i18n';

// A Part page's address, in a language: `/<language>/parts/<partId>`.
export function partAddress(language: Language, partId: string): string {
  return `/${language}/parts/${partId}`;
}

// Where the Shopper app serves a Part's photo, from the path the API names
// it by, `/v1/photos/<photoId>`: at `/photos/<photoId>`, on the Shopper app's
// own origin, so that the browser never needs the API's address and a
// preview's image is the platform's own.
export function photoAddress(photoPath: string): string {
  return `/photos/${photoPath.split('/').at(-1) ?? ''}`;
}
