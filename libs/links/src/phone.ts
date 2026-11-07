// The address that calls a phone number, from its international form, which
// the API answers and stores with no spaces (RFC 3966):
// `tel:+9647501234567`. A tap on it opens the phone's dialler.
export function callTo(internationalNumber: string): string {
  return `tel:${internationalNumber}`;
}
