// What a search looks in: the name, the manufacturer and the part numbers,
// in lower case. It is stored beside them, because an index cannot be made on
// the list of part numbers joined in a query. Every Store that writes a Part
// writes it.
export function searchTextOf(
  name: string,
  manufacturer: string,
  partNumbers: readonly string[],
): string {
  return [name, manufacturer, ...partNumbers].join(' ').toLowerCase();
}
