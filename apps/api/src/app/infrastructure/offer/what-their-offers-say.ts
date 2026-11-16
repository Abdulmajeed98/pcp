import { and, eq, sql, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { Currency } from '~/domain/currency/currency';
import type { Schema } from '~/infrastructure/database/schema';
import { part } from '~/infrastructure/part/part.schema';
import { currentPlatformRate } from '~/infrastructure/platform-rate/current-platform-rate';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer } from './offer.schema';
import { shownPriceIn } from './shown-price-in-the-database';
import { visibleOffer } from './visible-offer';
import { inTheOrderOfAPartsOffers } from './visible-offers-order';

// What each Part's visible Offers say of it in a currency, at now by the
// API's clock, at the current Platform Rate, for a query of Parts, which
// joins `currentRate` once and `offered` laterally after `part`: how many
// there are, which is how many Vendors offer it, since a Vendor has one Offer
// for a Part at most; whether any is in stock; and its Lowest Price, the
// Shown Price of the first in stock as a Part's page lists them, the lowest,
// with whether it is converted and the identifier and name of the Vendor
// whose Offer it is. It describes the Part, and never decides
// whether the Part is read: a Category's list asks the rule for a Visible
// Part, and a Build reads the Parts it names. It is written once, here, so
// that a Category's list and a Build's Parts answer one Lowest Price.
// Drizzle names a subquery's field by its alias alone, so each alias here,
// and in a query that uses it, is one no table in the same statement has as
// a column.
export function whatTheirOffersSay(
  client: NodePgDatabase<Schema>,
  currency: Currency,
  now: Date,
) {
  const currentRate = currentPlatformRate(client).as('current_rate');
  const shownPrice = shownPriceIn(currency, sql`${currentRate.iqdPerUsd}`);
  const inTheirOrder = sql.join(inTheOrderOfAPartsOffers(shownPrice.amount), sql`, `);
  // The first of them in stock, in the order a Part's page lists them.
  function firstInStock<T>(value: SQL): SQL<T | null> {
    return sql<T | null>`(array_agg(${value} order by ${inTheirOrder}) filter (where ${offer.inStock}))[1]`;
  }

  const offered = client
    .select({
      vendorCount: sql<number>`count(*)::int`.as('vendor_count'),
      inStock: sql<boolean>`coalesce(bool_or(${offer.inStock}), false)`.as('any_in_stock'),
      lowestAmount: firstInStock<number>(shownPrice.amount)
        .mapWith(Number)
        .as('lowest_amount'),
      lowestConverted: firstInStock<boolean>(shownPrice.converted).as('lowest_converted'),
      lowestVendorId: firstInStock<string>(sql`${vendor.id}`).as('lowest_vendor_id'),
      lowestVendorName: firstInStock<string>(sql`${vendor.name}`).as('lowest_vendor_name'),
    })
    .from(offer)
    .innerJoin(vendor, eq(vendor.id, offer.vendorId))
    .where(and(eq(offer.partId, part.id), visibleOffer(now)))
    .as('offered');

  return { currentRate, offered };
}
