import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

// Relative paths and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { sharedBuild } from '../shared-build/shared-build.schema';
import { vendor } from '../vendor/vendor.schema';

// Every Referral: one tap by a Shopper on "send on WhatsApp", one row each
// (SHR-6). A row is only ever added. It holds the Vendor, the Shared Build
// and the moment, and nothing about the Shopper (ADR-0014). Neither a Vendor
// nor a Shared Build is ever deleted, so nothing cascades into it.
export const referral = pgTable(
  'referral',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendor.id),
    sharedBuildId: uuid('shared_build_id')
      .notNull()
      .references(() => sharedBuild.id),
    // From the API's clock and never from the database's, so that a test
    // moves time by moving the API's clock alone, and it has no default.
    referredAt: timestamp('referred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // A Vendor's Referral count, and every Vendor's on the Admin's list.
    index('referral_vendor_index').on(table.vendorId),
  ],
);
