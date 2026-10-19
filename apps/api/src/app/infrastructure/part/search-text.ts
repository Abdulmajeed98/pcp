import { ilike, SQL } from 'drizzle-orm';

import { part } from './part.schema';

// A word to be found anywhere in the search text. Its `%`, `_` and `\` are
// taken as themselves and not as parts of a pattern.
function containing(word: string): string {
  return `%${word.toLowerCase().replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

// The conditions that a Part holds every word in its name, manufacturer or
// part numbers, regardless of case, for every Store that searches Parts.
export function holdingEveryWord(words: readonly string[]): SQL[] {
  return words.map((word) => ilike(part.searchText, containing(word)));
}
