import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

// The name of the rule that one Build's text is stored once, which sharing
// the same Build again, even from two requests at once, meets.
export const oneSharedBuildForABuild = 'shared_build_part_values_unique';

// Every Shared Build: a frozen copy of a Build's Parts and quantities (SHR-1).
// A row is only ever added, never changed or deleted, since its link lives in
// people's chats (ADR-0014). It holds nothing about the Shopper who shared it.
export const sharedBuild = pgTable(
  'shared_build',
  {
    // A random UUID, which cannot be guessed from another Shared Build's.
    id: uuid('id').defaultRandom().primaryKey(),
    // The Build's `part` values as `GET v1/build` takes them, joined by
    // commas: lower-case identifiers, in the catalog's order of Categories,
    // then the Build's order for RAM kits and drives, each kit or drive with
    // its quantity. Text, with no reference to a Part, so that a Part that
    // leaves the catalog leaves the Shared Build readable. No two rows hold
    // the same, so the same Build shared again is the same Shared Build.
    partValues: text('part_values').notNull(),
    // From the API's clock and never from the database's, so that a test
    // moves time by moving the API's clock alone, and it has no default.
    sharedAt: timestamp('shared_at', { withTimezone: true }).notNull(),
  },
  (table) => [unique(oneSharedBuildForABuild).on(table.partValues)],
);

export type SharedBuildRow = typeof sharedBuild.$inferSelect;
