import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// A relative path and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { City } from '../../domain/vendor/City';

// The database's list of cities is the domain's. Drizzle wants it as a list
// that is known not to be empty.
const [firstCity, ...otherCities] = City.keys();

export const vendorCity = pgEnum('vendor_city', [firstCity, ...otherCities]);

export const vendor = pgTable(
  'vendor',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // As the Vendor writes it.
    name: text('name').notNull(),
    city: vendorCity('city').notNull(),
    // As the Vendor writes it, on one or more lines.
    address: text('address').notNull(),
    // The map location, in degrees: both or neither.
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    // In the international form, +9647501234567, as the login phone number.
    phoneNumber: text('phone_number').notNull(),
    whatsAppNumber: text('whatsapp_number'),
    // Bare and in lower case.
    instagramName: text('instagram_name'),
    // As the Vendor writes them, on one or more lines.
    openingHours: text('opening_hours'),
    // In the international form, +9647501234567, which is also the name of
    // the Vendor's Login. No two Vendors share one.
    loginPhoneNumber: text('login_phone_number').notNull().unique(),
    // The identifier of the Vendor's own Login in Keycloak. No two Vendors
    // share one.
    loginId: uuid('login_id').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Set by the database's clock on every change, as the time of creation is,
    // so that the two never disagree about which came first.
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    // A map location is a latitude and a longitude together, or neither.
    check(
      'vendor_map_location_whole',
      sql`(${table.latitude} IS NULL) = (${table.longitude} IS NULL)`,
    ),
  ],
);

export type VendorRow = typeof vendor.$inferSelect;
