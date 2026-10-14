// A Part's part numbers as the catalog keeps them: each without the space
// around it, none empty, and no two that differ only in case. The first
// spelling of a number is the one kept.
export function cleanPartNumbers(partNumbers: readonly string[]): string[] {
  const seen = new Set<string>();

  return partNumbers
    .map((partNumber) => partNumber.trim())
    .filter((partNumber) => {
      const key = partNumber.toLowerCase();
      if (partNumber === '' || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
