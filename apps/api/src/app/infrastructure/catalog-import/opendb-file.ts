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

// What went wrong at the bottom, rather than a wrapping of it, such as
// Drizzle's, which holds a whole statement and every value in it, or fetch's,
// which says only that it failed. Node gives a connection it tried at several
// addresses as an error of errors, with no message of its own.
export function reasonOf(error: unknown): string {
  const { cause, message, errors } = error as {
    cause?: unknown;
    message?: unknown;
    errors?: unknown;
  };
  if (cause !== undefined) return reasonOf(cause);
  if (typeof message === 'string' && message !== '') return message;
  if (Array.isArray(errors)) return errors.map(reasonOf).join('; ');
  return String(error);
}
