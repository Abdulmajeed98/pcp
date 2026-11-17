// An identifier as the API writes every one, a Part's, a Vendor's or a
// Shared Build's: a UUID, in small letters. One written in capitals is the
// same identifier, and any other text is none.
const identifier = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function identifierIn(text: string): string | undefined {
  const lower = text.toLowerCase();
  return identifier.test(lower) ? lower : undefined;
}
