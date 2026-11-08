import { Injectable, Logger } from '@nestjs/common';
import {
  databaseErrorOf,
  PageableAttributes,
  PageAttributes,
  StructuredError,
} from '@pcp/core';
import { and, asc, eq, inArray, sql, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Either, Option } from 'effect';

import { Currency, currencyFacts } from '~/domain/currency/currency';
import { PriceRange } from '~/domain/offer/PriceRange';
import { ShownPrice } from '~/domain/offer/shown-price';
import { VisiblePart } from '~/domain/offer/VisiblePart';
import { FilterValues, VisiblePartsFilters } from '~/domain/offer/VisiblePartsFilters';
import {
  ListVisiblePartsParams,
  ReadVisiblePartsFiltersParams,
  VisiblePartsPage,
  VisiblePartStore,
} from '~/domain/offer/VisiblePartStore';
import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';
import {
  Filter,
  FilterChoice,
  FilterValue,
  filtersOf,
} from '~/domain/specification/filters';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { onePageOf } from '~/infrastructure/database/paging';
import type { Schema } from '~/infrastructure/database/schema';
import { part, PartRow } from '~/infrastructure/part/part.schema';
import { partOf, partWithPhoto } from '~/infrastructure/part/part-of-row';
import { holdingEveryWord } from '~/infrastructure/part/search-text';
import { isMissingAt, specificationAt } from '~/infrastructure/part/specification-at';
import { partPhoto } from '~/infrastructure/photo/photo.schema';
import { currentPlatformRate } from '~/infrastructure/platform-rate/current-platform-rate';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer } from '../offer.schema';
import { inTheDatabase, shownPriceIn } from '../shown-price-in-the-database';
import { visibleOffer, visiblePart } from '../visible-offer';
import { inTheOrderOfAPartsOffers } from '../visible-offers-order';

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

// A Part with an in-stock Visible Offer, as the database asks it of what its
// Visible Offers say of it (`whatTheirOffersSay`), when only those are asked
// for, as the picker asks (BLD-2); no condition otherwise.
function inStockOnly(asked: boolean, anyInStock: SQL.Aliased<boolean>): SQL | undefined {
  return asked ? sql`${anyInStock}` : undefined;
}

// What each Part's visible Offers say of it in a currency, at now by the
// API's clock, at the current Platform Rate, for a query of Visible Parts,
// which joins `currentRate` once and `offered` laterally after `part`: how
// many there are, which is how many Vendors offer it, since a Vendor has one
// Offer for a Part at most; whether any is in stock; and its Lowest Price,
// the Shown Price of the first in stock as a Part's page lists them, the
// lowest, with whether it is converted. It describes the Part, and the rule
// for a Visible Part alone decides whether the Part is read. Drizzle names a
// subquery's field by its alias alone, so each alias here, and in a query
// that uses it, is one no table in the same statement has as a column.
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

// Every Visible Part a Category's list asks for, in a statement of its own
// that a read pages or reads whole, with what its Offers say of it and its
// place in the list's order (BRW-1): a Lowest Price first, the lowest first;
// then in stock with none; then all out of stock; then by name and
// identifier. The current Platform Rate is read once, in the one statement
// that reads the Parts, their page and their total, so that every Lowest
// Price, the order and the total are at one rate.
function theListOf(client: NodePgDatabase<Schema>, params: ListVisiblePartsParams) {
  const now = params.getNow();
  const currency = params.getCurrency();
  const { currentRate, offered } = whatTheirOffersSay(client, currency, now);

  return client.$with('listed').as(
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
          inStockOnly(params.isInStockOnly(), offered.inStock),
        ),
      ),
  );
}

// What a Part's Visible Offers say of it, as a row of the list gives it.
type WhatTheySay = {
  photoId: string | null;
  vendorCount: number | null;
  inStock: boolean | null;
  lowestAmount: number | null;
  lowestConverted: boolean | null;
};

// A row of the list as a Visible Part, its Lowest Price in the currency.
function visiblePartOf(
  row: PartRow,
  said: WhatTheySay,
  currency: Currency,
): Either.Either<VisiblePart, StructuredError> {
  return Either.map(
    partOf(row, said.photoId),
    (found) =>
      new VisiblePart(
        found,
        said.lowestAmount === null
          ? null
          : new ShownPrice(currency, said.lowestAmount, said.lowestConverted === true),
        said.vendorCount ?? 0,
        said.inStock === true,
      ),
  );
}

// Shoppers' Visible Parts, read from the database: a Category's list of
// them, its filters and one Visible Part, each by `visiblePart(now)`.
@Injectable()
export class DatabaseVisiblePartStore implements VisiblePartStore {
  private readonly logger = new Logger(DatabaseVisiblePartStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async listVisibleParts(
    params: ListVisiblePartsParams,
    pageable: PageableAttributes,
  ): Promise<Either.Either<VisiblePartsPage, StructuredError>> {
    const client = this.databaseProvider.getClient();
    const listed = theListOf(client, params);
    const { counted, onThePage } = onePageOf(client, listed, pageable);

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
        .leftJoin(listed, onThePage)
        .leftJoin(part, eq(part.id, listed.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .orderBy(asc(listed.place));

      const parts = Either.all(
        rows.flatMap(({ part: row, ...said }) =>
          row === null ? [] : [visiblePartOf(row, said, params.getCurrency())],
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

  async listEveryVisiblePart(
    params: ListVisiblePartsParams,
  ): Promise<Either.Either<readonly VisiblePart[], StructuredError>> {
    const client = this.databaseProvider.getClient();
    const listed = theListOf(client, params);

    try {
      const rows = await client
        .with(listed)
        .select({
          part,
          photoId: partPhoto.id,
          vendorCount: listed.vendorCount,
          inStock: listed.inStock,
          lowestAmount: listed.lowestAmount,
          lowestConverted: listed.lowestConverted,
        })
        .from(listed)
        .innerJoin(part, eq(part.id, listed.partId))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .orderBy(asc(listed.place));

      return Either.all(
        rows.map(({ part: row, ...said }) =>
          visiblePartOf(row, said, params.getCurrency()),
        ),
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
        .where(
          and(
            theVisiblePartsOf(category, params.getNow()),
            inStockOnly(params.isInStockOnly(), offered.inStock),
          ),
        );

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
}
