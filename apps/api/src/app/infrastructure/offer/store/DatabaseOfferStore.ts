import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, PageAttributes, ServerError, StructuredError } from '@pcp/core';
import { and, asc, count, desc, eq, gt, gte, lt, sql, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import {
  aboutToExpireIfConfirmedBefore,
  expiredIfConfirmedBefore,
} from '~/domain/offer/expiry';
import { Offer } from '~/domain/offer/Offer';
import { offerDetailRefused } from '~/domain/offer/offer-errors';
import {
  CreateOfferParams,
  EditOfferParams,
  ListVendorsOffersParams,
  ListVendorsWithExpiringOffersParams,
  OfferStore,
  RemoveOfferParams,
  VendorsOfferCounts,
  VendorsOffersPage,
  VendorsWithExpiringOffersPage,
} from '~/domain/offer/OfferStore';
import { VendorWithExpiringOffers } from '~/domain/offer/VendorWithExpiringOffers';
import { PhoneNumber } from '~/domain/phone-number/PhoneNumber';
import { visibleOfferRuleAt } from '~/domain/offer/visibility';
import { VisibleOffer } from '~/domain/offer/VisibleOffer';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { brokeUniqueRule } from '~/infrastructure/database/unique-rule';
import { part, PartRow } from '~/infrastructure/part/part.schema';
import { partOf } from '~/infrastructure/part/part-of-row';
import { holdingEveryWord } from '~/infrastructure/part/search-text';
import { partPhoto } from '~/infrastructure/photo/photo.schema';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer, offerHistory, OfferRow, oneOfferForAPart } from '../offer.schema';

// An Offer's row with its Part's row and its photo's identifier, as a read
// gives them.
const offerWithPart = { offer, part, photoId: partPhoto.id };

// How many rows meet a condition, as a number.
function countWhere(condition: SQL | undefined): SQL<number> {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

// The rule for a visible Offer, as the database asks it, at now by the API's
// clock: of an active Vendor, and not an Expired Offer (`visibility.ts`). A
// query that uses it joins the Vendor. Every query of visible Offers uses it,
// and no other.
function visibleOffer(now: Date): SQL | undefined {
  const rule = visibleOfferRuleAt(now);
  return and(
    eq(vendor.active, rule.vendorActive),
    gte(offer.confirmedAt, rule.confirmedFrom),
  );
}

// An Expired Offer, and one about to expire, as the database asks them, at now
// by the API's clock: the same moments as the Offer entity's rules
// (`expiry.ts`), from the same now.
function expiredAt(now: Date): SQL {
  return lt(offer.confirmedAt, expiredIfConfirmedBefore(now));
}
function aboutToExpireAt(now: Date): SQL | undefined {
  return and(
    gte(offer.confirmedAt, expiredIfConfirmedBefore(now)),
    lt(offer.confirmedAt, aboutToExpireIfConfirmedBefore(now)),
  );
}

// The Vendor's Offer with this identifier. The Vendor is part of what is
// asked, so that another Vendor's Offer is not found, read, changed or
// removed.
function ofTheVendor(vendorId: string, offerId: string): SQL | undefined {
  return and(eq(offer.vendorId, vendorId), eq(offer.id, offerId));
}

// A row as an Offer, with its Part.
function toDomain(
  row: OfferRow,
  partRow: PartRow,
  photoId: string | null,
): Either.Either<Offer, StructuredError> {
  return Either.map(
    partOf(partRow, photoId),
    (offered) =>
      new Offer(
        row.id,
        row.vendorId,
        offered,
        row.usdPriceCents,
        row.iqdPrice,
        row.inStock,
        row.warrantyMonths,
        row.confirmedAt,
        row.createdAt,
      ),
  );
}

// A Vendor's stored phone number as the domain's, or a server error naming the
// Vendor: every number is checked before it is stored, so one the domain
// cannot read means the two have drifted apart.
function phoneNumberOf(
  vendorId: string,
  stored: string,
): Either.Either<PhoneNumber, StructuredError> {
  return Either.mapLeft(PhoneNumber.read(stored), () =>
    ServerError.of(`A Vendor has a phone number the API cannot read: ${vendorId}`),
  );
}

// A Vendor's row on the list of whom to remind, with its counts.
function vendorWithExpiringOffersOf(row: {
  id: string;
  name: string;
  phoneNumber: string;
  whatsAppNumber: string | null;
  offers: number;
  expired: number;
  aboutToExpire: number;
}): Either.Either<VendorWithExpiringOffers, StructuredError> {
  const phoneNumber = phoneNumberOf(row.id, row.phoneNumber);
  if (Either.isLeft(phoneNumber)) return Either.left(phoneNumber.left);
  let whatsAppNumber: PhoneNumber | null = null;
  if (row.whatsAppNumber !== null) {
    const read = phoneNumberOf(row.id, row.whatsAppNumber);
    if (Either.isLeft(read)) return Either.left(read.left);
    whatsAppNumber = read.right;
  }

  return Either.right(
    new VendorWithExpiringOffers(
      row.id,
      row.name,
      phoneNumber.right,
      whatsAppNumber,
      new VendorsOfferCounts(row.offers, row.expired, row.aboutToExpire),
    ),
  );
}

@Injectable()
export class DatabaseOfferStore implements OfferStore {
  private readonly logger = new Logger(DatabaseOfferStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async create(params: CreateOfferParams): Promise<Either.Either<Offer, StructuredError>> {
    const details = params.getDetails();
    const vendorAndPart = { vendorId: params.getVendorId(), partId: params.getPartId() };
    const pricesAndStock = {
      usdPriceCents: details.getUsdPriceCents(),
      iqdPrice: details.getIqdPrice(),
      inStock: details.isInStock(),
    };

    let offerId: string;
    try {
      offerId = await this.databaseProvider.getClient().transaction(async (transaction) => {
        const [row] = await transaction
          .insert(offer)
          .values({
            ...vendorAndPart,
            ...pricesAndStock,
            warrantyMonths: details.getWarrantyMonths(),
            confirmedAt: params.getConfirmedAt(),
            createdAt: params.getConfirmedAt(),
          })
          .returning({ id: offer.id });
        await transaction.insert(offerHistory).values({
          ...vendorAndPart,
          ...pricesAndStock,
          changedAt: params.getConfirmedAt(),
          change: 'created',
          changedBy: params.getCallerId(),
        });

        return row.id;
      });
    } catch (error) {
      if (brokeUniqueRule(error, oneOfferForAPart)) {
        return Either.left(offerDetailRefused('partId', 'taken'));
      }
      this.logger.error(error, 'An Offer could not be created');
      return Either.left(databaseErrorOf(error, 'An Offer could not be created'));
    }

    // Read again, as every read is, with its Part.
    const created = await this.readById(params.getVendorId(), offerId);
    return Either.flatMap(created, (found) =>
      Either.fromOption(found, () =>
        ServerError.of(`An Offer was created and could not be read back: ${offerId}`),
      ),
    );
  }

  async edit(
    params: EditOfferParams,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>> {
    const vendorId = params.getVendorId();
    const offerId = params.getOfferId();
    if (!couldBeIdentifier(vendorId) || !couldBeIdentifier(offerId)) {
      return Either.right(Option.none());
    }
    const details = params.getDetails();
    const pricesAndStock = {
      usdPriceCents: details.getUsdPriceCents(),
      iqdPrice: details.getIqdPrice(),
      inStock: details.isInStock(),
    };

    let found: boolean;
    try {
      found = await this.databaseProvider.getClient().transaction(async (transaction) => {
        // The Offer as it stands, held until the transaction ends, so that a
        // change made at the same time waits and is compared with this one's.
        const [before] = await transaction
          .select({
            partId: offer.partId,
            usdPriceCents: offer.usdPriceCents,
            iqdPrice: offer.iqdPrice,
            inStock: offer.inStock,
          })
          .from(offer)
          .where(ofTheVendor(vendorId, offerId))
          .for('update');
        if (before === undefined) return false;

        await transaction
          .update(offer)
          .set({
            ...pricesAndStock,
            warrantyMonths: details.getWarrantyMonths(),
            confirmedAt: params.getConfirmedAt(),
          })
          .where(eq(offer.id, offerId));
        if (details.changePricesOrStockOf(before)) {
          await transaction.insert(offerHistory).values({
            vendorId,
            partId: before.partId,
            ...pricesAndStock,
            changedAt: params.getConfirmedAt(),
            change: 'changed',
            changedBy: params.getCallerId(),
          });
        }

        return true;
      });
    } catch (error) {
      this.logger.error(error, 'An Offer could not be changed');
      return Either.left(databaseErrorOf(error, 'An Offer could not be changed'));
    }
    if (!found) return Either.right(Option.none());

    // Read again, as every read is, with its Part.
    return this.readById(vendorId, offerId);
  }

  async remove(
    params: RemoveOfferParams,
  ): Promise<Either.Either<boolean, StructuredError>> {
    const vendorId = params.getVendorId();
    const offerId = params.getOfferId();
    if (!couldBeIdentifier(vendorId) || !couldBeIdentifier(offerId)) {
      return Either.right(false);
    }

    try {
      const removed = await this.databaseProvider
        .getClient()
        .transaction(async (transaction) => {
          const [row] = await transaction
            .delete(offer)
            .where(ofTheVendor(vendorId, offerId))
            .returning({
              partId: offer.partId,
              usdPriceCents: offer.usdPriceCents,
              iqdPrice: offer.iqdPrice,
              inStock: offer.inStock,
            });
          if (row === undefined) return false;

          // The history's rows are keyed by the Vendor and the Part, not by
          // the Offer, so they stay; this one marks the removal, with the
          // prices and the stock the Offer had.
          await transaction.insert(offerHistory).values({
            vendorId,
            ...row,
            changedAt: params.getRemovedAt(),
            change: 'removed',
            changedBy: params.getCallerId(),
          });
          return true;
        });

      return Either.right(removed);
    } catch (error) {
      this.logger.error(error, 'An Offer could not be removed');
      return Either.left(databaseErrorOf(error, 'An Offer could not be removed'));
    }
  }

  async listByVendor(
    params: ListVendorsOffersParams,
  ): Promise<Either.Either<VendorsOffersPage, StructuredError>> {
    const pageable = params.getPageable();
    if (!couldBeIdentifier(params.getVendorId())) {
      return Either.right(
        new VendorsOffersPage([], PageAttributes.of(pageable, 0), VendorsOfferCounts.NONE),
      );
    }
    const theVendors = eq(offer.vendorId, params.getVendorId());
    const where = and(theVendors, ...holdingEveryWord(params.getWords()));
    const now = params.getNow();

    try {
      // One snapshot for all, so that an Offer added or confirmed between them
      // cannot make the totals disagree with the page.
      const [rows, [{ total }], [counts]] = await this.databaseProvider
        .getClient()
        .transaction(
          (transaction) =>
            Promise.all([
              transaction
                .select(offerWithPart)
                .from(offer)
                .innerJoin(part, eq(part.id, offer.partId))
                .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
                .where(where)
                .orderBy(asc(offer.confirmedAt), asc(part.name), asc(offer.id))
                .limit(pageable.getLimit())
                .offset(pageable.getOffset()),
              transaction
                .select({ total: count() })
                .from(offer)
                .innerJoin(part, eq(part.id, offer.partId))
                .where(where),
              // Of all the Vendor's Offers, whatever the search.
              transaction
                .select({
                  offers: count(),
                  expired: countWhere(expiredAt(now)),
                  aboutToExpire: countWhere(aboutToExpireAt(now)),
                })
                .from(offer)
                .where(theVendors),
            ]),
          { isolationLevel: 'repeatable read', accessMode: 'read only' },
        );

      const offers = Either.all(
        rows.map((row) => toDomain(row.offer, row.part, row.photoId)),
      );
      return Either.map(
        offers,
        (found) =>
          new VendorsOffersPage(
            found,
            PageAttributes.of(pageable, total),
            new VendorsOfferCounts(counts.offers, counts.expired, counts.aboutToExpire),
          ),
      );
    } catch (error) {
      this.logger.error(error, "A Vendor's Offers could not be listed");
      return Either.left(databaseErrorOf(error, "A Vendor's Offers could not be listed"));
    }
  }

  async listVendorsWithExpiringOffers(
    params: ListVendorsWithExpiringOffersParams,
  ): Promise<Either.Either<VendorsWithExpiringOffersPage, StructuredError>> {
    const pageable = params.getPageable();
    const now = params.getNow();
    const expired = countWhere(expiredAt(now));
    // Expired, or about to expire: confirmed before the moment an Offer
    // starts to be about to expire.
    const expiredOrAboutToExpire = countWhere(
      lt(offer.confirmedAt, aboutToExpireIfConfirmedBefore(now)),
    );

    try {
      // One snapshot for both, so that an Offer confirmed between them cannot
      // make the total disagree with the page.
      const [rows, [{ total }]] = await this.databaseProvider.getClient().transaction(
        (transaction) => {
          // Each active Vendor with at least one Offer expired or about to
          // expire, with its counts of all its Offers.
          const expiring = () =>
            transaction
              .select({
                id: vendor.id,
                name: vendor.name,
                phoneNumber: vendor.phoneNumber,
                whatsAppNumber: vendor.whatsAppNumber,
                offers: count().as('offers'),
                expired: expired.as('expired'),
                aboutToExpire: countWhere(aboutToExpireAt(now)).as('about_to_expire'),
              })
              .from(offer)
              .innerJoin(vendor, eq(vendor.id, offer.vendorId))
              .where(eq(vendor.active, true))
              .groupBy(vendor.id)
              .having(gt(expiredOrAboutToExpire, 0));

          return Promise.all([
            expiring()
              .orderBy(
                // By the soonest expiry among the Vendor's Offers, which is
                // that of the one confirmed longest ago. An Expired Offer
                // counts as sooner than any other, and the same for every
                // Vendor that has one, so those Vendors come first and the
                // name decides among them.
                sql`case when ${expired} > 0 then null else min(${offer.confirmedAt}) end asc nulls first`,
                asc(vendor.name),
                asc(vendor.id),
              )
              .limit(pageable.getLimit())
              .offset(pageable.getOffset()),
            transaction.select({ total: count() }).from(expiring().as('expiring')),
          ]);
        },
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );

      return Either.map(
        Either.all(rows.map(vendorWithExpiringOffersOf)),
        (vendors) =>
          new VendorsWithExpiringOffersPage(vendors, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, 'The Vendors with expiring Offers could not be listed');
      return Either.left(
        databaseErrorOf(error, 'The Vendors with expiring Offers could not be listed'),
      );
    }
  }

  async confirmAll(
    vendorId: string,
    confirmedAt: Date,
  ): Promise<Either.Either<number, StructuredError>> {
    if (!couldBeIdentifier(vendorId)) return Either.right(0);

    try {
      const { rowCount } = await this.databaseProvider
        .getClient()
        .update(offer)
        .set({ confirmedAt })
        .where(eq(offer.vendorId, vendorId));

      return Either.right(rowCount ?? 0);
    } catch (error) {
      this.logger.error(error, "A Vendor's Offers could not be confirmed");
      return Either.left(
        databaseErrorOf(error, "A Vendor's Offers could not be confirmed"),
      );
    }
  }

  async listVisibleByPart(
    partId: string,
    now: Date,
  ): Promise<Either.Either<readonly VisibleOffer[], StructuredError>> {
    if (!couldBeIdentifier(partId)) return Either.right([]);

    try {
      const rows = await this.databaseProvider
        .getClient()
        .select({ ...offerWithPart, vendorName: vendor.name })
        .from(offer)
        .innerJoin(vendor, eq(vendor.id, offer.vendorId))
        .innerJoin(part, eq(part.id, offer.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(and(eq(offer.partId, partId), visibleOffer(now)))
        // In stock first (OFF-11), until `pricing` orders by price.
        .orderBy(
          desc(offer.inStock),
          desc(offer.confirmedAt),
          asc(vendor.name),
          asc(offer.id),
        );

      return Either.all(
        rows.map((row) =>
          Either.map(
            toDomain(row.offer, row.part, row.photoId),
            (found) => new VisibleOffer(found, row.vendorName),
          ),
        ),
      );
    } catch (error) {
      this.logger.error(error, "A Part's visible Offers could not be listed");
      return Either.left(
        databaseErrorOf(error, "A Part's visible Offers could not be listed"),
      );
    }
  }

  async readById(
    vendorId: string,
    offerId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>> {
    if (!couldBeIdentifier(vendorId) || !couldBeIdentifier(offerId)) {
      return Either.right(Option.none());
    }

    return this.readOneWhere(ofTheVendor(vendorId, offerId));
  }

  async readByPart(
    vendorId: string,
    partId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>> {
    if (!couldBeIdentifier(vendorId) || !couldBeIdentifier(partId)) {
      return Either.right(Option.none());
    }

    return this.readOneWhere(and(eq(offer.vendorId, vendorId), eq(offer.partId, partId)));
  }

  private async readOneWhere(
    where: SQL | undefined,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select(offerWithPart)
        .from(offer)
        .innerJoin(part, eq(part.id, offer.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(where);

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row.offer, row.part, row.photoId), Option.some);
    } catch (error) {
      this.logger.error(error, 'An Offer could not be read');
      return Either.left(databaseErrorOf(error, 'An Offer could not be read'));
    }
  }
}
