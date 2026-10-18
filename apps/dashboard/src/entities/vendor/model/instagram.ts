// A Vendor's Instagram name as Instagram writes a handle, with an @ before
// it. The API keeps it bare and in lower case.
export function instagramHandleOf(name: string): string {
  return `@${name}`;
}

// The address of the Instagram profile a name is, as Instagram's own links
// to a profile are written.
export function instagramProfileOf(name: string): string {
  return `https://www.instagram.com/${encodeURIComponent(name)}/`;
}
