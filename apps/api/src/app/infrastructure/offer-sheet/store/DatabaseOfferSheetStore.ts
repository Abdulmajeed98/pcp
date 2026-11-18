import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { asc, eq, sql, SQL } from 'drizzle-orm';
import { Either } from 'effect';

import { OfferDetails } from '~/domain/offer/OfferDetails';
import { foldedPartNumber } from '~/domain/offer-sheet/offer-sheet-layout';
import {
  OfferOnTheSheet,
  PartNumberHeld,
  PartNumberHolders,
  PartOnTheSheet,
} from '~/domain/offer-sheet/OfferOnTheSheet';
import { OfferSheetContents, OfferSheetStore } from '~/domain/offer-sheet/OfferSheetStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { offer } from '~/infrastructure/offer/offer.schema';
import { placeOfCategory } from '~/infrastructure/part/category-order';
import { part } from '~/infrastructure/part/part.schema';

// A Part that holds at least one of these part numbers, folded. PostgreSQL's
// `lower` only narrows what is read: the domain's fold, `foldedPartNumber`,
// decides which Parts hold a number, so the download's choice and the
// upload's match compare alike.
function holdingAnyOf(folded: readonly string[]): SQL {
  return sql`exists (select 1 from unnest(${part.partNumbers}) as held(part_number) where lower(held.part_number) in (${sql.join(
    folded.map((each) => sql`${each}`),
    sql`, `,
  )}))`;
}

@Injectable()
export class DatabaseOfferSheetStore extends OfferSheetStore {
  private readonly logger = new Logger(DatabaseOfferSheetStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {
    super();
  }

  async readOffersOf(
    vendorId: string,
  ): Promise<Either.Either<OfferSheetContents, StructuredError>> {
    if (!couldBeIdentifier(vendorId)) {
      return Either.right(new OfferSheetContents([], new PartNumberHolders([])));
    }

    try {
      // One snapshot for both, so that a part number the Admin gives another
      // Part meanwhile cannot make a row's number disagree with its Part's.
      // One query at a time: the transaction holds one connection.
      const [rows, holders] = await this.databaseProvider.getClient().transaction(
        async (transaction) => {
          const offers = await transaction
            .select({
              offer,
              partName: part.name,
              partNumbers: part.partNumbers,
            })
            .from(offer)
            .innerJoin(part, eq(part.id, offer.partId))
            .where(eq(offer.vendorId, vendorId))
            .orderBy(asc(placeOfCategory(part.category)), asc(part.name), asc(offer.id));

          const folded = [
            ...new Set(offers.flatMap((row) => row.partNumbers.map(foldedPartNumber))),
          ];
          const holding =
            folded.length === 0
              ? []
              : await transaction
                  .select({ partId: part.id, partNumbers: part.partNumbers })
                  .from(part)
                  .where(holdingAnyOf(folded));
          return [offers, holding] as const;
        },
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );

      const offers = rows.map(
        (row) =>
          new OfferOnTheSheet(
            row.offer.id,
            new PartOnTheSheet(row.offer.partId, row.partName, row.partNumbers),
            OfferDetails.asKept(
              row.offer.usdPriceCents,
              row.offer.iqdPrice,
              row.offer.inStock,
              row.offer.warrantyMonths,
            ),
          ),
      );
      const held = holders.flatMap((holder) =>
        holder.partNumbers.map(
          (partNumber) => new PartNumberHeld(holder.partId, partNumber),
        ),
      );
      return Either.right(new OfferSheetContents(offers, new PartNumberHolders(held)));
    } catch (error) {
      this.logger.error(error, "A Vendor's Offer sheet could not be read");
      return Either.left(
        databaseErrorOf(error, "A Vendor's Offer sheet could not be read"),
      );
    }
  }
}
