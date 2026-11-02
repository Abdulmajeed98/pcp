import { desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { Schema } from '~/infrastructure/database/schema';

import { platformRate } from './platform-rate.schema';

// The current Platform Rate's row, as the database asks it: the newest
// setting, and of two set at the same moment the one added later, or no row
// until the Admin sets the first. Every read of the current rate takes it
// from here: the rate's own read awaits it, and a query that shows prices
// joins it as a subquery, so that its Offers and their Shown Prices are read
// at one rate in one query, as a Part's visible Offers are, and as `browse`
// and `builder` will.
export function currentPlatformRate(client: NodePgDatabase<Schema>) {
  return client
    .select()
    .from(platformRate)
    .orderBy(desc(platformRate.setAt), desc(platformRate.id))
    .limit(1);
}
