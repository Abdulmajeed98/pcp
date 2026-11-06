import { Injectable, Logger } from '@nestjs/common';
import {
  databaseErrorOf,
  PageableAttributes,
  PageAttributes,
  ServerError,
  StructuredError,
} from '@pcp/core';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  sql,
  SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Either, Option } from 'effect';

import {
  aboutToExpireIfConfirmedBefore,
  expiredIfConfirmedBefore,
} from '~/domain/offer/expiry';
import { Currency, currencyFacts } from '~/domain/currency/currency';
import { Offer } from '~/domain/offer/Offer';
import { Part } from '~/domain/part/Part';
import { offerDetailRefused } from '~/domain/offer/offer-errors';
import { PriceRange } from '~/domain/offer/PriceRange';
import { OfferState } from '~/domain/offer/offer-state';
import { PlatformFigures } from '~/domain/offer/PlatformFigures';
import { convertedPriceIn, ShownPrice, WholeNumbers } from '~/domain/offer/shown-price';
import {
  CreateOfferParams,
  EditOfferParams,
  ListVendorsOffersParams,
  ListVendorsWithExpiringOffersParams,
  ListVisiblePartsParams,
  OfferCounts,
  OfferStore,
  ReadVisiblePartsFiltersParams,
  RemoveOfferParams,
  VendorsOfferCounts,
  VendorsOffersPage,
  VendorsWithExpiringOffersPage,
  VisiblePartsPage,
} from '~/domain/offer/OfferStore';
import { VendorWithExpiringOffers } from '~/domain/offer/VendorWithExpiringOffers';
import { PhoneNumber } from '~/domain/phone-number/PhoneNumber';
import { visibleOfferRuleAt } from '~/domain/offer/visibility';
import { VisibleOffer } from '~/domain/offer/VisibleOffer';
import { VisibleOffersOfVendorPage } from '~/domain/offer/VisibleOffersOfVendorPage';
import { VisiblePart } from '~/domain/offer/VisiblePart';
import { FilterValues, VisiblePartsFilters } from '~/domain/offer/VisiblePartsFilters';
import { Category } from '~/domain/part/Category';
import {
  Filter,
  FilterChoice,
  FilterValue,
  filtersOf,
} from '~/domain/specification/filters';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import type { Schema } from '~/infrastructure/database/schema';
import { brokeUniqueRule } from '~/infrastructure/database/unique-rule';
import { placeOfCategory } from '~/infrastructure/part/category-order';
import { part, PartRow } from '~/infrastructure/part/part.schema';
import { partOf, partWithPhoto } from '~/infrastructure/part/part-of-row';
import { holdingEveryWord } from '~/infrastructure/part/search-text';
import { isMissingAt, specificationAt } from '~/infrastructure/part/specification-at';
import { partPhoto } from '~/infrastructure/photo/photo.schema';
import { currentPlatformRate } from '~/infrastructure/platform-rate/current-platform-rate';
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

// The rule for a Visible Part, as the database asks it of a Part, at now by
// the API's clock: a Part with at least one visible Offer, by
// `visibleOffer(now)` (CAT-7). Every query of Parts for Shoppers asks it of
// `part`, and no other: a Category's list here, and a Visible Part's own read,
// its Category's filters and the picker (`browse` and `builder`).
function visiblePart(now: Date): SQL {
  return sql`exists (select 1 from ${offer} inner join ${vendor} on ${eq(vendor.id, offer.vendorId)} where ${and(eq(offer.partId, part.id), visibleOffer(now))})`;
}

// OFF-11's order of visible Offers (PRC-4), given their Shown Price: in stock
// first, then the lowest Shown Price as answered, after rounding, with none
// after the others; then the most recent Confirmation. Each list of them
// adds what tells its Offers apart, so that the order is the same at every
// read.
function inOff11sOrder(shownAmount: SQL): SQL[] {
  return [desc(offer.inStock), sql`${shownAmount} asc nulls last`, desc(offer.confirmedAt)];
}

// The order of a Part's visible Offers: OFF-11's, then the Vendor's name and
// the Offer's identifier. A query that uses it joins the Vendor.
function inTheOrderOfAPartsOffers(shownAmount: SQL): SQL[] {
  return [...inOff11sOrder(shownAmount), asc(vendor.name), asc(offer.id)];
}

// The order of a Vendor's visible Offers: by their Parts' Categories, in the
// catalog's order, and within each Category OFF-11's, then the Part's name
// and the Offer's identifier. A query that uses it joins the Part.
function inTheOrderOfAVendorsOffers(shownAmount: SQL): SQL[] {
  return [
    placeOfCategory(part.category),
    ...inOff11sOrder(shownAmount),
    asc(part.name),
    asc(offer.id),
  ];
}

// A Category's Visible Parts, as the database asks it of a Part, at now by
// the API's clock, by `visiblePart(now)`.
function theVisiblePartsOf(category: Category, now: Date): SQL | undefined {
  return and(eq(part.category, category.getKey()), visiblePart(now));
}

// A Part of one of the manufacturers, as the database asks it, or of any when
// none is given.
function ofAnyManufacturer(manufacturers: readonly string[]): SQL | undefined {
  return manufacturers.length === 0
    ? undefined
    : inArray(part.manufacturer, [...manufacturers]);
}

// A Part matching a choice among its Category's filters, as the database asks
// it: one whose value of the filter's specification is any of those chosen,
// compared as JSON, so that a number matches a number and text matches text.
// A Part missing the specification, or holding a value that stands for "not
// known", holds none of them: a value chosen is one the specification could
// hold (`filters.ts`).
function matching(choice: FilterChoice): SQL {
  const values = choice.getValues().map((value) => sql`${JSON.stringify(value)}::jsonb`);
  return sql`${specificationAt(choice.getFilter().getSpecification())} in (${sql.join(values, sql`, `)})`;
}

// A Lowest Price within a price range, as the database asks it of the amount
// as answered, after rounding (PRC-4), in the currency's unit: at or above
// the lowest end and at or below the highest, each a whole number of ones of
// the currency. An amount that is null, for a Part with no Lowest Price, is
// within no range that has an end.
function within(range: PriceRange, currency: Currency, lowestAmount: SQL): SQL[] {
  const inItsUnit = (end: number) =>
    inTheDatabase.times(
      inTheDatabase.of(end),
      inTheDatabase.of(currencyFacts[currency].unitsInOne),
    );
  const lowest = range.getLowest();
  const highest = range.getHighest();
  return [
    ...(lowest === undefined ? [] : [sql`${lowestAmount} >= ${inItsUnit(lowest)}`]),
    ...(highest === undefined ? [] : [sql`${lowestAmount} <= ${inItsUnit(highest)}`]),
  ];
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

// Whole numbers as the database computes them, in `bigint`, so that a price
// at the top of the Offers' limits times the highest rate cannot overflow.
// Its division of two positive whole numbers rounds down.
const inTheDatabase: WholeNumbers<SQL> = {
  of: (value) => sql`${value}::bigint`,
  plus: (a, b) => sql`(${a} + ${b})`,
  times: (a, b) => sql`(${a} * ${b})`,
  over: (a, b) => sql`(${a} / ${b})`,
  greatest: (a, b) => sql`greatest(${a}, ${b})`,
};

// An Offer's Quoted Price in each currency, in its unit, or null.
const quotedPrice = {
  USD: offer.usdPriceCents,
  IQD: offer.iqdPrice,
} satisfies Record<Currency, unknown>;
function quotedPriceIn(currency: Currency): SQL {
  return sql`${quotedPrice[currency]}`;
}

// An Offer's Shown Price in a currency, in its unit, as the database asks it
// at a Platform Rate: its Quoted Price in that currency if it has one, else
// its Converted Price by the rule in `shown-price.ts`, else null when there
// is no rate. A query that uses it joins the current rate, read in the same
// query as its Offers.
function shownPriceIn(
  currency: Currency,
  iqdPerUsd: SQL,
): {
  amount: SQL<number | null>;
  converted: SQL<boolean>;
} {
  const quoted = quotedPriceIn(currency);
  const other = quotedPriceIn(currencyFacts[currency].other);
  const converted = convertedPriceIn(
    inTheDatabase,
    currency,
    sql`${other}::bigint`,
    sql`${iqdPerUsd}::bigint`,
  );
  return {
    amount: sql<
      number | null
    >`coalesce(${quoted}::bigint, case when ${iqdPerUsd} is not null and ${other} is not null then ${converted} end)`.mapWith(
      Number,
    ),
    converted: sql<boolean>`${quoted} is null`,
  };
}

// What each Part's visible Offers say of it in a currency, at now by the
// API's clock, at the current Platform Rate, for a query of Parts for
// Shoppers, which joins `currentRate` once and `offered` laterally after
// `part`: how many there are, which is how many Vendors offer it, since a
// Vendor has one Offer for a Part at most; whether any is in stock; and its
// Lowest Price, the Shown Price of the first in stock as a Part's page lists
// them, the lowest, with whether it is converted. It describes the Part, and
// the rule for a Visible Part alone decides whether the Part is read. Drizzle
// names a subquery's field by its alias alone, so each alias here, and in a
// query that uses it, is one no table in the same statement has as a column.
function whatTheirOffersSay(client: NodePgDatabase<Schema>, currency: Currency, now: Date) {
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
    })
    .from(offer)
    .innerJoin(vendor, eq(vendor.id, offer.vendorId))
    .where(and(eq(offer.partId, part.id), visibleOffer(now)))
    .as('offered');

  return { currentRate, offered };
}

// An Offer out of stock.
const outOfStock = eq(offer.inStock, false);

// The Offers in a state, as the database asks it, at now by the API's clock:
// every one; those that need confirming, an Expired Offer or one about to
// expire, which are both confirmed before the moment an Offer starts to be
// about to expire; or those out of stock.
function inState(state: OfferState, now: Date): SQL | undefined {
  switch (state) {
    case 'all':
      return undefined;
    case 'needs-confirming':
      return lt(offer.confirmedAt, aboutToExpireIfConfirmedBefore(now));
    case 'out-of-stock':
      return outOfStock;
  }
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
      new OfferCounts(row.offers, row.expired, row.aboutToExpire),
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
    const now = params.getNow();
    const where = and(
      theVendors,
      inState(params.getState(), now),
      ...holdingEveryWord(params.getWords()),
    );

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
              // Of all the Vendor's Offers, whatever the search and the state.
              transaction
                .select({
                  offers: count(),
                  expired: countWhere(expiredAt(now)),
                  aboutToExpire: countWhere(aboutToExpireAt(now)),
                  outOfStock: countWhere(outOfStock),
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
            new VendorsOfferCounts(
              counts.offers,
              counts.expired,
              counts.aboutToExpire,
              counts.outOfStock,
            ),
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
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<readonly VisibleOffer[], StructuredError>> {
    if (!couldBeIdentifier(partId)) return Either.right([]);

    try {
      const client = this.databaseProvider.getClient();
      // The current Platform Rate, or no row when none has been set, read in
      // the same query as the Offers, so that their Shown Prices and their
      // order are all at one rate.
      const currentRate = currentPlatformRate(client).as('current_rate');
      const shownPrice = shownPriceIn(currency, sql`${currentRate.iqdPerUsd}`);

      const rows = await client
        .select({
          ...offerWithPart,
          vendorName: vendor.name,
          shownAmount: shownPrice.amount,
          shownConverted: shownPrice.converted,
        })
        .from(offer)
        .innerJoin(vendor, eq(vendor.id, offer.vendorId))
        .innerJoin(part, eq(part.id, offer.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .leftJoin(currentRate, sql`true`)
        .where(and(eq(offer.partId, partId), visibleOffer(now)))
        .orderBy(...inTheOrderOfAPartsOffers(shownPrice.amount));

      return Either.all(
        rows.map((row) =>
          Either.map(
            toDomain(row.offer, row.part, row.photoId),
            (found) =>
              new VisibleOffer(
                found,
                row.vendorName,
                row.shownAmount === null
                  ? null
                  : new ShownPrice(currency, row.shownAmount, row.shownConverted),
              ),
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

  async listVisibleParts(
    params: ListVisiblePartsParams,
  ): Promise<Either.Either<VisiblePartsPage, StructuredError>> {
    const client = this.databaseProvider.getClient();
    const now = params.getNow();
    const currency = params.getCurrency();
    const pageable = params.getPageable();
    // The current Platform Rate, read once, in the one statement that reads
    // the Parts, their page and their total, so that every Lowest Price, the
    // order and the total are at one rate.
    const { currentRate, offered } = whatTheirOffersSay(client, currency, now);

    // Every Visible Part asked for, with what its Offers say of it and its
    // place in the list's order (BRW-1): a Lowest Price first, the lowest
    // first; then in stock with none; then all out of stock; then by name and
    // identifier.
    const listed = client.$with('listed').as(
      client
        .select({
          partId: sql<string>`${part.id}`.as('visible_part_id'),
          vendorCount: offered.vendorCount,
          inStock: offered.inStock,
          lowestAmount: offered.lowestAmount,
          lowestConverted: offered.lowestConverted,
          place:
            sql<number>`row_number() over (order by ${offered.lowestAmount} asc nulls last, ${offered.inStock} desc, ${part.name} asc, ${part.id} asc)`
              .mapWith(Number)
              .as('place_in_list'),
        })
        .from(part)
        .leftJoin(currentRate, sql`true`)
        .crossJoinLateral(offered)
        .where(
          and(
            theVisiblePartsOf(params.getCategory(), now),
            ...holdingEveryWord(params.getWords()),
            ofAnyManufacturer(params.getManufacturers()),
            ...params.getChoices().map(matching),
            ...within(params.getPriceRange(), currency, sql`${offered.lowestAmount}`),
          ),
        ),
    );
    // How many there are, as one row, which the page is joined to, so that a
    // page past the end still answers the total.
    const counted = client
      .select({ total: sql<number>`count(*)::int`.as('total') })
      .from(listed)
      .as('counted');
    const offset = pageable.getOffset();

    try {
      const rows = await client
        .with(listed)
        .select({
          total: counted.total,
          part,
          photoId: partPhoto.id,
          vendorCount: listed.vendorCount,
          inStock: listed.inStock,
          lowestAmount: listed.lowestAmount,
          lowestConverted: listed.lowestConverted,
        })
        .from(counted)
        .leftJoin(
          listed,
          and(gt(listed.place, offset), lte(listed.place, offset + pageable.getLimit())),
        )
        .leftJoin(part, eq(part.id, listed.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .orderBy(asc(listed.place));

      const parts = Either.all(
        rows.flatMap((row) =>
          row.part === null
            ? []
            : [
                Either.map(
                  partOf(row.part, row.photoId),
                  (found) =>
                    new VisiblePart(
                      found,
                      row.lowestAmount === null
                        ? null
                        : new ShownPrice(
                            currency,
                            row.lowestAmount,
                            row.lowestConverted === true,
                          ),
                      row.vendorCount ?? 0,
                      row.inStock === true,
                    ),
                ),
              ],
        ),
      );
      return Either.map(
        parts,
        (found) => new VisiblePartsPage(found, PageAttributes.of(pageable, rows[0].total)),
      );
    } catch (error) {
      this.logger.error(error, "A Category's Visible Parts could not be listed");
      return Either.left(
        databaseErrorOf(error, "A Category's Visible Parts could not be listed"),
      );
    }
  }

  async readVisiblePartsFilters(
    params: ReadVisiblePartsFiltersParams,
  ): Promise<Either.Either<VisiblePartsFilters, StructuredError>> {
    const client = this.databaseProvider.getClient();
    const category = params.getCategory();
    const currency = params.getCurrency();
    const filters = filtersOf(category);
    // The current Platform Rate, read once, in the one statement that reads
    // the Parts, so that both ends of the range are at one rate.
    const { currentRate, offered } = whatTheirOffersSay(client, currency, params.getNow());
    // A filter's distinct values among the Parts, leaving out what stands for
    // "not known", in the order of their JSON: numbers by size, and text by
    // the database's collation, as names are ordered; or null when no Part
    // holds one.
    function valuesOf(filter: Filter): SQL {
      const value = specificationAt(filter.getSpecification());
      return sql`jsonb_agg(distinct ${value} order by ${value}) filter (where not ${isMissingAt(filter.getSpecification())})`;
    }

    try {
      const [row] = await client
        .select({
          manufacturers: sql<
            string[] | null
          >`array_agg(distinct ${part.manufacturer} order by ${part.manufacturer})`,
          values: sql<(FilterValue[] | null)[]>`jsonb_build_array(${sql.join(
            filters.map(valuesOf),
            sql`, `,
          )})`,
          lowestPrice: sql<number | null>`min(${offered.lowestAmount})`.mapWith(Number),
          highestPrice: sql<number | null>`max(${offered.lowestAmount})`.mapWith(Number),
        })
        .from(part)
        .leftJoin(currentRate, sql`true`)
        .crossJoinLateral(offered)
        .where(theVisiblePartsOf(category, params.getNow()));

      return Either.right(
        new VisiblePartsFilters(
          row.manufacturers ?? [],
          filters.flatMap((filter, index) => {
            const values = row.values[index];
            return values === null ? [] : [new FilterValues(filter, values)];
          }),
          currency,
          row.lowestPrice,
          row.highestPrice,
        ),
      );
    } catch (error) {
      this.logger.error(error, "A Category's filters could not be read");
      return Either.left(databaseErrorOf(error, "A Category's filters could not be read"));
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

  async readVisiblePart(
    partId: string,
    now: Date,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!couldBeIdentifier(partId)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select(partWithPhoto)
        .from(part)
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(and(eq(part.id, partId), visiblePart(now)));

      if (row === undefined) return Either.right(Option.none());
      return Either.map(partOf(row.part, row.photoId), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Visible Part could not be read');
      return Either.left(databaseErrorOf(error, 'A Visible Part could not be read'));
    }
  }

  async listVisibleByVendor(
    vendorId: string,
    currency: Currency,
    pageable: PageableAttributes,
    now: Date,
  ): Promise<Either.Either<Option.Option<VisibleOffersOfVendorPage>, StructuredError>> {
    if (!couldBeIdentifier(vendorId)) return Either.right(Option.none());

    const client = this.databaseProvider.getClient();
    // The current Platform Rate, read once, in the one statement that reads
    // the Vendor, its Offers, their page and their total, so that every Shown
    // Price, the order and the total are at one rate.
    const currentRate = currentPlatformRate(client).as('current_rate');
    const shownPrice = shownPriceIn(currency, sql`${currentRate.iqdPerUsd}`);
    const inTheirOrder = sql.join(inTheOrderOfAVendorsOffers(shownPrice.amount), sql`, `);

    // Every visible Offer of the Vendor, with its Shown Price and its place in
    // the order of a Vendor's Offers. Drizzle names a subquery's field by its
    // alias alone, so each alias here and below is one no table in the same
    // statement has as a column.
    const listed = client.$with('listed').as(
      client
        .select({
          offerId: sql<string>`${offer.id}`.as('listed_offer_id'),
          shownAmount: shownPrice.amount.as('shown_amount'),
          shownConverted: shownPrice.converted.as('shown_converted'),
          place: sql<number>`row_number() over (order by ${inTheirOrder})`
            .mapWith(Number)
            .as('place_in_list'),
        })
        .from(offer)
        .innerJoin(vendor, eq(vendor.id, offer.vendorId))
        .innerJoin(part, eq(part.id, offer.partId))
        .leftJoin(currentRate, sql`true`)
        .where(and(eq(offer.vendorId, vendorId), visibleOffer(now))),
    );
    // How many there are, as one row, which the page is joined to, so that a
    // page past the end still answers the total.
    const counted = client
      .select({ total: sql<number>`count(*)::int`.as('total') })
      .from(listed)
      .as('counted');
    const offset = pageable.getOffset();

    try {
      // The Vendor's row, which there is none of when it is deactivated or
      // unknown, since Shoppers see only active Vendors (ACC-7), with the
      // total and the page's Offers.
      const rows = await client
        .with(listed)
        .select({
          vendorName: vendor.name,
          total: counted.total,
          offer,
          part,
          photoId: partPhoto.id,
          shownAmount: listed.shownAmount,
          shownConverted: listed.shownConverted,
        })
        .from(vendor)
        .innerJoin(counted, sql`true`)
        .leftJoin(
          listed,
          and(gt(listed.place, offset), lte(listed.place, offset + pageable.getLimit())),
        )
        .leftJoin(offer, eq(offer.id, listed.offerId))
        .leftJoin(part, eq(part.id, offer.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(and(eq(vendor.id, vendorId), eq(vendor.active, true)))
        .orderBy(asc(listed.place));
      if (rows.length === 0) return Either.right(Option.none());

      const offers = Either.all(
        rows.flatMap((row) =>
          row.offer === null || row.part === null
            ? []
            : [
                Either.map(
                  toDomain(row.offer, row.part, row.photoId),
                  (found) =>
                    new VisibleOffer(
                      found,
                      row.vendorName,
                      row.shownAmount === null
                        ? null
                        : new ShownPrice(
                            currency,
                            row.shownAmount,
                            row.shownConverted === true,
                          ),
                    ),
                ),
              ],
        ),
      );
      return Either.map(offers, (found) =>
        Option.some(
          new VisibleOffersOfVendorPage(found, PageAttributes.of(pageable, rows[0].total)),
        ),
      );
    } catch (error) {
      this.logger.error(error, "A Vendor's visible Offers could not be listed");
      return Either.left(
        databaseErrorOf(error, "A Vendor's visible Offers could not be listed"),
      );
    }
  }

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
