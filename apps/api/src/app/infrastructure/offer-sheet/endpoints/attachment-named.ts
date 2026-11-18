// A `Content-Disposition` that names a file to save, so that a Kurdish or an
// Arabic name survives (RFC 6266): the name itself as UTF-8, percent-encoded
// as RFC 8187 asks, which every current browser reads; and before it a plain
// name in ASCII, for a program that reads only that, which an HTTP header
// can carry as it is.
export function attachmentNamed(name: string, plainName: string): string {
  const plain = plainName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${plain}"; filename*=UTF-8''${encoded}`;
}
