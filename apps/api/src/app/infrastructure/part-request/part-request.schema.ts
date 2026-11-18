import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Relative paths and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { part, partCategory } from '../part/part.schema';
import { vendor } from '../vendor/vendor.schema';

// Where a Part Request stands: open until the Admin resolves it, then
// fulfilled or rejected, once.
export const partRequestState = pgEnum('part_request_state', [
  'open',
  'fulfilled',
  'rejected',
]);

// Every Part Request a Vendor sent (REQ-1). A row is never deleted, and
// nothing changes it but its resolution, which happens once, so nothing
// cascades into it or from it. It holds no manufacturer and no
// specification: those are the Admin's to give (CAT-4).
export const partRequest = pgTable(
  'part_request',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendor.id),
    // The Category the Vendor gave, which the Part that fulfils it need not
    // have.
    category: partCategory('category').notNull(),
    // As the Vendor wrote it.
    name: text('name').notNull(),
    // As the catalog cleans a part number: without invisible marks and
    // without the space around it.
    partNumber: text('part_number').notNull(),
    // The Offer the Vendor would make, stored as an Offer's details are: the
    // Quoted Prices, at least one, USD in whole cents and IQD in whole
    // dinars; whether it is in stock; and the warranty in whole months, or
    // null when the Vendor states none.
    usdPriceCents: integer('usd_price_cents'),
    iqdPrice: integer('iqd_price'),
    inStock: boolean('in_stock').notNull(),
    warrantyMonths: integer('warranty_months'),
    // When the Vendor sent it, from the API's clock and never from the
    // database's, so that a test moves time by moving the API's clock alone,
    // and it has no default.
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    state: partRequestState('state').notNull(),
    // The Part that fulfilled it, for a fulfilled request alone.
    partId: uuid('part_id').references(() => part.id),
    // The Admin's reason, as the Admin wrote it, for a rejected request
    // alone.
    reason: text('reason'),
    // When the Admin resolved it, by the API's clock, for a resolved request
    // alone.
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    // The Admin's queue: the open requests, oldest first.
    index('part_request_state_sent_index').on(table.state, table.sentAt),
    // A Vendor's list of its requests, newest first.
    index('part_request_vendor_sent_index').on(table.vendorId, table.sentAt),
    check(
      'part_request_has_a_price',
      sql`${table.usdPriceCents} IS NOT NULL OR ${table.iqdPrice} IS NOT NULL`,
    ),
    // Each state holds what it must and nothing of another's: an open
    // request no resolution; a fulfilled one its Part and the moment; a
    // rejected one its reason and the moment.
    check(
      'part_request_open_is_unresolved',
      sql`${table.state} <> 'open' OR (${table.partId} IS NULL AND ${table.reason} IS NULL AND ${table.resolvedAt} IS NULL)`,
    ),
    check(
      'part_request_fulfilled_has_its_part',
      sql`${table.state} <> 'fulfilled' OR (${table.partId} IS NOT NULL AND ${table.reason} IS NULL AND ${table.resolvedAt} IS NOT NULL)`,
    ),
    check(
      'part_request_rejected_has_its_reason',
      sql`${table.state} <> 'rejected' OR (${table.reason} IS NOT NULL AND ${table.partId} IS NULL AND ${table.resolvedAt} IS NOT NULL)`,
    ),
  ],
);

export type PartRequestRow = typeof partRequest.$inferSelect;
