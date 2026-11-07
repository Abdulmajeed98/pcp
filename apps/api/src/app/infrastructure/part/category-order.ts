import { SQL, sql, SQLWrapper } from 'drizzle-orm';

import { Category } from '~/domain/part/Category';

// The eight Categories in the catalog's fixed order, as the database holds
// them.
const theEight = sql`ARRAY[${sql.join(
  Category.keys().map((key) => sql`${key}`),
  sql`, `,
)}]::part_category[]`;

// The place of a Part's Category among the eight, in the catalog's fixed
// order, the CPU first and the PSU last, for every Store that orders by it.
export function placeOfCategory(category: SQLWrapper): SQL {
  return sql`array_position(${theEight}, ${category})`;
}
