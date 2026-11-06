import { apiClient } from '@/shared/api';

// The headers of the API's answer that the Shopper app's answer keeps: what
// the photo is, how long a browser may keep it, a year since a replaced photo
// has a new address, and that its type is not to be guessed.
const keptHeaders = [
  'content-type',
  'content-length',
  'cache-control',
  'x-content-type-options',
  'etag',
  'last-modified',
];

// A Part's photo, served at the Shopper app's own address, `/photos/<photoId>`,
// by passing the API's photo through with the API's own headers, so that the
// browser never needs the API's address and a preview's image is on the
// platform's own origin. A photo the API does not have answers 404, as the
// API does; while the API cannot be reached, it answers 503.
export async function passThePhotoThrough(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> },
): Promise<Response> {
  const { photoId } = await params;
  const { data, response } = await apiClient().readPhoto({
    path: { photoId },
    parseAs: 'blob',
  });
  if (response === undefined) return new Response(null, { status: 503 });

  const headers = new Headers();
  for (const name of keptHeaders) {
    const value = response.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  if (!response.ok || data === undefined) {
    return new Response(null, { status: response.status === 404 ? 404 : 502 });
  }
  return new Response(data, { status: 200, headers });
}
