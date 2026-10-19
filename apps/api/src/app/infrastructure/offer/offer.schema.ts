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
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Relative paths and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { part } from '../part/part.schema';
import { vendor } from '../vendor/vendor.schema';

// The name of the rule that a Vendor has at most one Offer for a Part, which
// the Store tells apart from other refusals.
export const oneOfferForAPart = 'offer_vendor_part_unique';

export const offer = pgTable(
  'offer',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendor.id),
    partId: uuid('part_id')
      .notNull()
      .references(() => part.id),
    // The Quoted Prices, at least one: USD in whole cents, IQD in whole dinars.
    usdPriceCents: integer('usd_price_cents'),
    iqdPrice: integer('iqd_price'),
    inStock: boolean('in_stock').notNull(),
    // In whole months, or null when the Vendor states none.
    warrantyMonths: integer('warranty_months'),
    // The time of the last Confirmation, and of creation, which is the first
    // Confirmation. Both come from the API's clock and never from the
    // database's, so that a test moves time by moving the API's clock alone,
    // and neither has a default.
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // A Vendor has at most one Offer for a Part (OFF-1), even when two
    // requests to add one arrive at once.
    unique(oneOfferForAPart).on(table.vendorId, table.partId),
    check(
      'offer_has_a_price',
      sql`${table.usdPriceCents} IS NOT NULL OR ${table.iqdPrice} IS NOT NULL`,
    ),
  ],
);

// What a row of the Offer history records.
export const offerChange = pgEnum('offer_change', ['created', 'changed', 'removed']);

// The Offer history: every change to an Offer's Quoted Prices or in-stock
// status (OFF-10). It is keyed by Vendor and Part and not by the Offer, which
// it does not reference, so that it outlives an Offer's removal and goes on
// when the Vendor offers the Part again.
export const offerHistory = pgTable(
  'offer_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // From the API's clock, as an Offer's times are.
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendor.id),
    partId: uuid('part_id')
      .notNull()
      .references(() => part.id),
    change: offerChange('change').notNull(),
    // The values after the change.
    usdPriceCents: integer('usd_price_cents'),
    iqdPrice: integer('iqd_price'),
    inStock: boolean('in_stock').notNull(),
    // The identifier of the Caller's Login: the Vendor's own, or the Admin's
    // when the Admin acts for the Vendor.
    changedBy: text('changed_by').notNull(),
  },
  (table) => [
    index('offer_history_vendor_part_index').on(
      table.vendorId,
      table.partId,
      table.changedAt,
    ),
  ],
);

export type OfferRow = typeof offer.$inferSelect;
