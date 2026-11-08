import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { Either } from 'effect';

import { BuildStore, CatalogPart } from '~/domain/build/BuildStore';
import {
  InStockOffer,
  InStockOffers,
  LowestPrice,
  OfferVendor,
} from '~/domain/build/in-stock-offers';
import { Currency } from '~/domain/currency/currency';
import { ShownPrice } from '~/domain/offer/shown-price';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { offer } from '~/infrastructure/offer/offer.schema';
import { shownPriceIn } from '~/infrastructure/offer/shown-price-in-the-database';
import { visibleOffer, visiblePart } from '~/infrastructure/offer/visible-offer';
import { whatTheirOffersSay } from '~/infrastructure/offer/what-their-offers-say';
import { part } from '~/infrastructure/part/part.schema';
import { partOf, partWithPhoto } from '~/infrastructure/part/part-of-row';
import { partPhoto } from '~/infrastructure/photo/photo.schema';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

// One of a Part's in-stock Visible Offers, as the statement gives it in JSON:
// its Vendor, and its Shown Price in the currency's unit, or null.
type InStockOfferRow = {
  vendorId: string;
  vendorName: string;
  amount: number | null;
  converted: boolean;
};

// The Parts a Build names, read from the database, each with whether it is a
// Visible Part by `visiblePart(now)`, its Lowest Price by
// `whatTheirOffersSay`, and its in-stock Visible Offers by `visibleOffer(now)`
// and `shownPriceIn`, the rules `offers`, `pricing` and `browse` wrote once.
@Injectable()
export class DatabaseBuildStore implements BuildStore {
  private readonly logger = new Logger(DatabaseBuildStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async readParts(
    partIds: readonly string[],
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<readonly CatalogPart[], StructuredError>> {
    if (partIds.length === 0) return Either.right([]);

    const client = this.databaseProvider.getClient();
    // The current Platform Rate, read once, in the one statement that reads
    // the Parts, their visibility and their Offers, so that every price in
    // the answer is at one rate and every Offer judged at one moment.
    const { currentRate, offered } = whatTheirOffersSay(client, currency, now);
    const shownPrice = shownPriceIn(currency, sql`${currentRate.iqdPerUsd}`);
    // Each Part's in-stock Visible Offers, each Vendor's, with its Shown
    // Price, as one list beside the Part. The alias is one no table in the
    // statement has as a column, since Drizzle names a subquery's field by
    // its alias alone.
    const stocked = client
      .select({
        offers: sql<
          InStockOfferRow[]
        >`coalesce(json_agg(json_build_object('vendorId', ${vendor.id}, 'vendorName', ${vendor.name}, 'amount', ${shownPrice.amount}, 'converted', ${shownPrice.converted})), '[]'::json)`.as(
          'in_stock_offers',
        ),
      })
      .from(offer)
      .innerJoin(vendor, eq(vendor.id, offer.vendorId))
      .where(and(eq(offer.partId, part.id), eq(offer.inStock, true), visibleOffer(now)))
      .as('stocked');

    try {
      const rows = await client
        .select({
          ...partWithPhoto,
          visible: sql<boolean>`${visiblePart(now)}`,
          lowestAmount: offered.lowestAmount,
          lowestConverted: offered.lowestConverted,
          lowestVendorId: offered.lowestVendorId,
          lowestVendorName: offered.lowestVendorName,
          inStockOffers: stocked.offers,
        })
        .from(part)
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .leftJoin(currentRate, sql`true`)
        .crossJoinLateral(offered)
        .crossJoinLateral(stocked)
        .where(inArray(part.id, [...partIds]));

      return Either.all(
        rows.map((row) =>
          Either.map(
            partOf(row.part, row.photoId),
            (found) =>
              new CatalogPart(
                found,
                row.visible,
                new InStockOffers(
                  row.lowestAmount === null ||
                    row.lowestVendorId === null ||
                    row.lowestVendorName === null
                    ? null
                    : new LowestPrice(
                        new ShownPrice(
                          currency,
                          row.lowestAmount,
                          row.lowestConverted === true,
                        ),
                        new OfferVendor(row.lowestVendorId, row.lowestVendorName),
                      ),
                  row.inStockOffers.map(
                    (each) =>
                      new InStockOffer(
                        new OfferVendor(each.vendorId, each.vendorName),
                        each.amount === null
                          ? null
                          : new ShownPrice(currency, each.amount, each.converted),
                      ),
                  ),
                ),
              ),
          ),
        ),
      );
    } catch (error) {
      this.logger.error(error, "A Build's Parts could not be read");
      return Either.left(databaseErrorOf(error, "A Build's Parts could not be read"));
    }
  }
}
