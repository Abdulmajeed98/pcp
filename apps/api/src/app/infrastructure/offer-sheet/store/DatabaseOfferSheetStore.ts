import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, ServerError, StructuredError } from '@pcp/core';
import { and, asc, eq, inArray, sql, SQL } from 'drizzle-orm';
import { Either } from 'effect';

import { OfferDetails } from '~/domain/offer/OfferDetails';
import { foldedPartNumber } from '~/domain/offer-sheet/offer-sheet-layout';
import {
  OfferOnTheSheet,
  PartNumberHeld,
  PartNumberHolders,
  PartOnTheSheet,
} from '~/domain/offer-sheet/OfferOnTheSheet';
import {
  ApplyOfferSheetParams,
  OfferSheetContents,
  OfferSheetMatches,
  OfferSheetRowApplied,
  OfferSheetStore,
} from '~/domain/offer-sheet/OfferSheetStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { Transaction } from '~/infrastructure/database/transaction';
import { offer } from '~/infrastructure/offer/offer.schema';
import {
  HeldOffer,
  holdTheOffer,
  holdTheOffers,
  OfferWriting,
  replaceTheDetailsOf,
  writeANewOfferUnlessOneIsThere,
} from '~/infrastructure/offer/offer-writing';
import { partRequest } from '~/infrastructure/part-request/part-request.schema';
import { placeOfCategory } from '~/infrastructure/part/category-order';
import { part } from '~/infrastructure/part/part.schema';
import { partOf, partWithPhoto } from '~/infrastructure/part/part-of-row';
import { partPhoto } from '~/infrastructure/photo/photo.schema';

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

// The Vendor's Offer for a row's Part was there when the upload wrote it, and
// gone again when the upload held it: thrown, so that the transaction puts
// back every row it had written, and answered as a server error.
class TheOfferCameAndWent extends Error {}

// Applies one row through the Offer module's own writing, in the
// transaction it is handed: replaces the Offer the Vendor has for the Part,
// held already, or makes one. When the Vendor's own add commits after the
// upload held its Offers, which found none, and before this writes, the
// database's unique pair finds it: this one then holds the Vendor's Offer
// as it now stands, and the row replaces it, the later statement.
async function theRowApplied(
  transaction: Transaction,
  vendorId: string,
  partId: string,
  held: HeldOffer | undefined,
  writing: OfferWriting,
): Promise<OfferSheetRowApplied> {
  let before = held;
  if (before === undefined) {
    const made = await writeANewOfferUnlessOneIsThere(
      transaction,
      vendorId,
      partId,
      writing,
    );
    if (made !== undefined) return { kind: 'added', offerId: made };
    before = await holdTheOffer(
      transaction,
      and(eq(offer.vendorId, vendorId), eq(offer.partId, partId)),
    );
    if (before === undefined) throw new TheOfferCameAndWent(partId);
  }

  await replaceTheDetailsOf(transaction, before, writing);
  return {
    kind: 'replaced',
    before: OfferDetails.asKept(
      before.usdPriceCents,
      before.iqdPrice,
      before.inStock,
      before.warrantyMonths,
    ),
  };
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

  async readMatchesOf(
    vendorId: string,
    foldedPartNumbers: readonly string[],
  ): Promise<Either.Either<OfferSheetMatches, StructuredError>> {
    if (!couldBeIdentifier(vendorId) || foldedPartNumbers.length === 0) {
      return Either.right(new OfferSheetMatches([], new Set(), []));
    }

    try {
      // One snapshot for the three, so that a Part, an Offer or a Part
      // Request changed meanwhile cannot make them disagree. One query at a
      // time: the transaction holds one connection.
      const [holders, offered, requests] = await this.databaseProvider
        .getClient()
        .transaction(
          async (transaction) => {
            const parts = await transaction
              .select(partWithPhoto)
              .from(part)
              .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
              .where(holdingAnyOf(foldedPartNumbers))
              .orderBy(asc(placeOfCategory(part.category)), asc(part.name), asc(part.id));
            const offers =
              parts.length === 0
                ? []
                : await transaction
                    .select({ partId: offer.partId })
                    .from(offer)
                    .where(
                      and(
                        eq(offer.vendorId, vendorId),
                        inArray(
                          offer.partId,
                          parts.map((row) => row.part.id),
                        ),
                      ),
                    );
            const open = await transaction
              .select({ partNumber: partRequest.partNumber })
              .from(partRequest)
              .where(
                and(eq(partRequest.vendorId, vendorId), eq(partRequest.state, 'open')),
              );
            return [parts, offers, open] as const;
          },
          { isolationLevel: 'repeatable read', accessMode: 'read only' },
        );

      return Either.map(
        Either.all(holders.map((row) => partOf(row.part, row.photoId))),
        (parts) =>
          new OfferSheetMatches(
            parts,
            new Set(offered.map((row) => row.partId)),
            requests.map((row) => row.partNumber),
          ),
      );
    } catch (error) {
      this.logger.error(error, "An Offer sheet's part numbers could not be matched");
      return Either.left(
        databaseErrorOf(error, "An Offer sheet's part numbers could not be matched"),
      );
    }
  }

  async apply(
    params: ApplyOfferSheetParams,
  ): Promise<Either.Either<readonly OfferSheetRowApplied[], StructuredError>> {
    const vendorId = params.getVendorId();
    const rows = params.getRows();
    if (rows.length === 0) return Either.right([]);

    try {
      return Either.right(
        await this.databaseProvider.getClient().transaction(async (transaction) => {
          // The Vendor's Offers for the rows' Parts, held from the start, so
          // that the Vendor's own change made at the same time waits for the
          // upload and is then compared with what it wrote.
          const held = await holdTheOffers(
            transaction,
            and(
              eq(offer.vendorId, vendorId),
              inArray(
                offer.partId,
                rows.map((row) => row.getPartId()),
              ),
            ),
          );
          const heldByPart = new Map(held.map((each) => [each.partId, each]));

          // Written in the order of the Parts' identifiers, so that two
          // uploads at once for one Vendor make its new Offers in the same
          // order, and neither waits for a Part the other waits on.
          const applied: OfferSheetRowApplied[] = [];
          const order = rows
            .map((row, index) => ({ row, index }))
            .sort((one, other) => (one.row.getPartId() < other.row.getPartId() ? -1 : 1));
          for (const { row, index } of order) {
            applied[index] = await theRowApplied(
              transaction,
              vendorId,
              row.getPartId(),
              heldByPart.get(row.getPartId()),
              {
                details: row.getDetails(),
                confirmedAt: params.getAppliedAt(),
                writtenAt: params.getAppliedAt(),
                callerId: params.getCallerId(),
              },
            );
          }
          return applied;
        }),
      );
    } catch (error) {
      if (error instanceof TheOfferCameAndWent) {
        return Either.left(
          ServerError.of(
            `The Vendor's Offer for the Part ${error.message} came and went while an Offer sheet was applied`,
          ),
        );
      }
      this.logger.error(error, 'An Offer sheet could not be applied');
      return Either.left(databaseErrorOf(error, 'An Offer sheet could not be applied'));
    }
  }
}
