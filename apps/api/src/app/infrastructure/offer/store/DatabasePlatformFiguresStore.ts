import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { eq, sql } from 'drizzle-orm';
import { Either } from 'effect';

import { PlatformFigures } from '~/domain/offer/PlatformFigures';
import { PlatformFiguresStore } from '~/domain/offer/PlatformFiguresStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { currentPlatformRate } from '~/infrastructure/platform-rate/current-platform-rate';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer } from '../offer.schema';
import { visibleOffer } from '../visible-offer';

// The platform's figures, read from the database: its active Vendors, its
// visible Offers and its current Platform Rate, in one statement.
@Injectable()
export class DatabasePlatformFiguresStore implements PlatformFiguresStore {
  private readonly logger = new Logger(DatabasePlatformFiguresStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async readPlatformFigures(
    now: Date,
  ): Promise<Either.Either<PlatformFigures, StructuredError>> {
    const client = this.databaseProvider.getClient();
    // How many active Vendors there are, and how many visible Offers, each
    // as one row, since a count with no grouping always answers one, and the
    // current Platform Rate, or no row when none has been set, joined in the
    // one statement that reads them, so that the figures are of one moment.
    // Each alias is a name no table in the statement has as a column.
    const currentRate = currentPlatformRate(client).as('current_rate');
    const activeVendors = client
      .select({ count: sql<number>`count(*)::int`.as('active_vendor_count') })
      .from(vendor)
      .where(eq(vendor.active, true))
      .as('active_vendors');
    const visibleOffers = client
      .select({ count: sql<number>`count(*)::int`.as('visible_offer_count') })
      .from(offer)
      .innerJoin(vendor, eq(vendor.id, offer.vendorId))
      .where(visibleOffer(now))
      .as('visible_offers');

    try {
      const [row] = await client
        .select({
          activeVendorCount: activeVendors.count,
          visibleOfferCount: visibleOffers.count,
          iqdPerUsd: currentRate.iqdPerUsd,
        })
        .from(activeVendors)
        .crossJoin(visibleOffers)
        .leftJoin(currentRate, sql`true`);

      return Either.right(
        new PlatformFigures(row.activeVendorCount, row.visibleOfferCount, row.iqdPerUsd),
      );
    } catch (error) {
      this.logger.error(error, "The platform's figures could not be read");
      return Either.left(
        databaseErrorOf(error, "The platform's figures could not be read"),
      );
    }
  }
}
