// The address that calls a phone number, from its international form, which
// is stored with no spaces (RFC 3966).
export function callTo(internationalNumber: string): string {
  return `tel:${internationalNumber}`;
}
