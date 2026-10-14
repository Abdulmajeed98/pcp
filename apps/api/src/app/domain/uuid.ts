// Whether a text is a UUID as it is usually written: 32 hexadecimal digits,
// in either case, in groups of 8, 4, 4, 4 and 12 joined by hyphens.
export function isUuid(text: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
}
