// The characters that are never seen, such as the left-to-right mark or the
// zero-width space a web page leaves in a code copied from it: Unicode's
// format characters.
const invisibleMarks = /\p{Cf}/gu;

// A part number as the catalog keeps one: without invisible marks and
// without the space around it, which may leave it empty. A Part Request's
// part number is cleaned so too.
export function cleanPartNumber(partNumber: string): string {
  return partNumber.replace(invisibleMarks, '').trim();
}

// A Part's part numbers as the catalog keeps them: each cleaned, none empty,
// and no two that differ only in case. The first spelling of a number is
// the one kept.
export function cleanPartNumbers(partNumbers: readonly string[]): string[] {
  const seen = new Set<string>();

  return partNumbers.map(cleanPartNumber).filter((partNumber) => {
    const key = partNumber.toLowerCase();
    if (partNumber === '' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
