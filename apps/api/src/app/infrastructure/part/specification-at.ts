import { sql, SQL } from 'drizzle-orm';

import { Specification } from '~/domain/specification/Specification';

import { part } from './part.schema';

// A Part's value of one specification, as the database reads it from its
// document: the JSON at the specification's path, or null when there is
// nothing there. The path is written into the statement, not passed with it,
// so that the same value asked twice in one statement is the same expression,
// as an aggregate of distinct values ordered by them needs. A path is a
// specification list's, in OpenDB's field names, which are letters, digits
// and underscores.
export function specificationAt(specification: Specification): SQL {
  const names = specification.getPath().split('.');
  if (!names.every((name) => /^\w+$/.test(name))) {
    throw new Error(`A specification's path cannot be written: ${specification.getPath()}`);
  }
  return sql`(${part.specifications} #> ${sql.raw(`'{${names.join(',')}}'`)})`;
}

// Whether a Part's specifications lack one specification, asked of its
// document as `Specification.isMissingIn` asks it of a value: nothing at the
// path, null, an empty text, an empty choice of several or list of text, and
// 0 where 0 stands for "not known". Every Store that asks it of a Part asks
// it here.
export function isMissingAt(specification: Specification): SQL {
  const value = specificationAt(specification);
  const empty = ['null', '""'];
  const kind = specification.getKind();
  if (kind === 'severalOf' || kind === 'listOfText') empty.push('[]');
  if (specification.isZeroMissing()) empty.push('0');

  return sql`(${value} IS NULL OR ${value} IN (${sql.join(
    empty.map((each) => sql`${each}::jsonb`),
    sql`, `,
  )}))`;
}
