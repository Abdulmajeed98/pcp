import type { PageableAttributes } from '@pcp/core';
import { and, gt, lte, sql, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { WithSubquery } from 'drizzle-orm/subquery';

import type { Schema } from './schema';

// A list a statement numbers by each row's place in its order, from 1, as a
// common table expression with the place among its fields.
type NumberedList = WithSubquery & { place: SQL.Aliased<number> };

// What gives one page of a numbered list in the statement that reads the
// list, page and total at once, so that both are of one moment: how many rows
// the list holds, as one row, which the page's rows are joined to, so that a
// page past the end still answers the total (`counted`); and the condition
// that joins the rows on the page, those whose place is past the page's
// offset and within its size (`onThePage`), as the catalog's paging asks.
export function onePageOf(
  client: NodePgDatabase<Schema>,
  listed: NumberedList,
  pageable: PageableAttributes,
) {
  const offset = pageable.getOffset();
  return {
    counted: client
      .select({ total: sql<number>`count(*)::int`.as('total') })
      .from(listed)
      .as('counted'),
    onThePage: and(
      gt(listed.place, offset),
      lte(listed.place, offset + pageable.getLimit()),
    ),
  };
}
