import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Every setting of the Platform Rate, one row each (PRC-1). Rows are only
// ever added, never changed or deleted, so that a past Converted Price can be
// reconstructed. The newest row is the current Platform Rate, and until the
// first there is none: only the Admin sets it, and no migration and no
// development service writes a row (ADR-0002).
export const platformRate = pgTable(
  'platform_rate',
  {
    // In the order the rows were added, which tells apart two settings made
    // at the same moment: the later one is the current.
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // Whole dinars per dollar. Its limits are the domain's, checked once
    // there (`PlatformRate.ts`), and not copied here.
    iqdPerUsd: integer('iqd_per_usd').notNull(),
    // From the API's clock and never from the database's, so that a test
    // moves time by moving the API's clock alone, and it has no default.
    setAt: timestamp('set_at', { withTimezone: true }).notNull(),
    // The identifier of the Caller's Login: the Admin's.
    setBy: text('set_by').notNull(),
  },
  (table) => [
    // The current Platform Rate, the newest row, which every read of a Shown
    // Price looks up.
    index('platform_rate_set_at_index').on(table.setAt, table.id),
  ],
);

export type PlatformRateRow = typeof platformRate.$inferSelect;
