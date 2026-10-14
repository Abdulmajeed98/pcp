import { Option } from 'effect';

import { OpenDbFile } from '~/domain/catalog-import/OpenDbSource';

// One of OpenDB's record files, by its name and what it holds. A file that
// does not hold JSON is given with no record, for the import to name.
export function openDbFileOf(name: string, text: string): OpenDbFile {
  try {
    return new OpenDbFile(name, Option.some(JSON.parse(text) as unknown));
  } catch {
    return new OpenDbFile(name, Option.none());
  }
}
