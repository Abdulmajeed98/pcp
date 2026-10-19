import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, PageAttributes, ServerError, StructuredError } from '@pcp/core';
import { and, asc, count, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';
import { PartMissingSpecifications } from '~/domain/part/PartMissingSpecifications';
import {
  CreatePartParams,
  EditPartParams,
  ListPartsMissingSpecificationsParams,
  PartsMissingSpecificationsPage,
  PartsPage,
  PartStore,
  SearchPartsParams,
} from '~/domain/part/PartStore';
import { Specification } from '~/domain/specification/Specification';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { offer } from '~/infrastructure/offer/offer.schema';
import { partPhoto } from '~/infrastructure/photo/photo.schema';

import { part } from '../part.schema';
import { columnsOf } from '../part-columns';
import { partOf, partWithPhoto } from '../part-of-row';

// A word to be found anywhere in the search text. Its `%`, `_` and `\` are
// taken as themselves and not as parts of a pattern.
function containing(word: string): string {
  return `%${word.toLowerCase().replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

// Whether a Part's specifications lack one specification, asked of its
// document as `Specification.isMissingIn` asks it of a value: nothing at the
// path, null, an empty text, an empty choice of several or list of text, and
// 0 where 0 stands for "not known".
function isMissingAt(specification: Specification): SQL {
  const path = `{${specification.getPath().split('.').join(',')}}`;
  const value = sql`(${part.specifications} #> ${path}::text[])`;
  const empty = ['null', '""'];
  const kind = specification.getKind();
  if (kind === 'severalOf' || kind === 'listOfText') empty.push('[]');
  if (specification.isZeroMissing()) empty.push('0');

  return sql`(${value} IS NULL OR ${value} IN (${sql.join(
    empty.map((each) => sql`${each}::jsonb`),
    sql`, `,
  )}))`;
}

// The paths of the needed specifications a Part lacks, in its list's order,
// as a list of text: for each Category, the paths of its needed ones that
// are missing.
function missingPathsOf(params: ListPartsMissingSpecificationsParams): SQL {
  const byCategory = Category.values().map((category) => {
    const paths = params
      .getNeededOf(category)
      .map(
        (specification) =>
          sql`CASE WHEN ${isMissingAt(specification)} THEN ${specification.getPath()}::text END`,
      );
    const missing =
      paths.length === 0
        ? sql`ARRAY[]::text[]`
        : sql`array_remove(ARRAY[${sql.join(paths, sql`, `)}], NULL)`;
    return sql`WHEN ${category.getKey()} THEN ${missing}`;
  });

  return sql`CASE ${part.category} ${sql.join(byCategory, sql` `)} END`;
}

// The place of a Category among the eight, for ordering by it.
const categoryOrder = sql`ARRAY[${sql.join(
  Category.keys().map((key) => sql`${key}`),
  sql`, `,
)}]::part_category[]`;

@Injectable()
export class DatabasePartStore implements PartStore {
  private readonly logger = new Logger(DatabasePartStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async create(params: CreatePartParams): Promise<Either.Either<Part, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .insert(part)
        .values({ category: params.getCategory().getKey(), ...columnsOf(params) })
        .returning();

      // A Part has no photo when it is created.
      return partOf(row, null);
    } catch (error) {
      this.logger.error(error, 'A Part could not be created');
      return Either.left(databaseErrorOf(error, 'A Part could not be created'));
    }
  }

  async edit(
    params: EditPartParams,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!couldBeIdentifier(params.getPartId())) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .update(part)
        .set(columnsOf(params))
        .where(eq(part.id, params.getPartId()))
        .returning();

      if (row === undefined) return Either.right(Option.none());
    } catch (error) {
      this.logger.error(error, 'A Part could not be edited');
      return Either.left(databaseErrorOf(error, 'A Part could not be edited'));
    }

    // Read again, as every read is, with its photo.
    return this.readById(params.getPartId());
  }

  async search(
    params: SearchPartsParams,
  ): Promise<Either.Either<PartsPage, StructuredError>> {
    const conditions: SQL[] = params
      .getWords()
      .map((word) => ilike(part.searchText, containing(word)));
    const category = params.getCategory();
    if (category !== undefined) conditions.push(eq(part.category, category.getKey()));
    const where = conditions.length === 0 ? undefined : and(...conditions);
    const pageable = params.getPageable();

    try {
      // One snapshot for both, so that a Part created between them cannot make
      // the totals disagree with the page.
      const [rows, [{ total }]] = await this.databaseProvider
        .getClient()
        .transaction(
          (transaction) =>
            Promise.all([
              transaction
                .select(partWithPhoto)
                .from(part)
                .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
                .where(where)
                .orderBy(asc(part.name), asc(part.id))
                .limit(pageable.getLimit())
                .offset(pageable.getOffset()),
              transaction.select({ total: count() }).from(part).where(where),
            ]),
          { isolationLevel: 'repeatable read', accessMode: 'read only' },
        );

      const parts = Either.all(rows.map((row) => partOf(row.part, row.photoId)));
      return Either.map(
        parts,
        (found) => new PartsPage(found, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, 'The catalog could not be searched');
      return Either.left(databaseErrorOf(error, 'The catalog could not be searched'));
    }
  }

  async listMissingSpecifications(
    params: ListPartsMissingSpecificationsParams,
  ): Promise<Either.Either<PartsMissingSpecificationsPage, StructuredError>> {
    const client = this.databaseProvider.getClient();
    // Every Part with an Offer, with its photo, its count of Offers and the
    // paths of the needed specifications it lacks.
    const offered = client.$with('offered').as(
      client
        .select({
          id: part.id,
          category: part.category,
          name: part.name,
          manufacturer: part.manufacturer,
          photoId: sql<string | null>`${partPhoto.id}`.as('photo_id'),
          offerCount: sql<number>`count(${offer.id})::int`.as('offer_count'),
          missing: sql<string[]>`${missingPathsOf(params)}`.as('missing'),
        })
        .from(part)
        .innerJoin(offer, eq(offer.partId, part.id))
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .groupBy(part.id, partPhoto.id),
    );
    const lacking = sql`cardinality(${offered.missing}) > 0`;
    const pageable = params.getPageable();

    try {
      // One snapshot for both, as a search takes, so that the totals agree
      // with the page.
      const [rows, [{ total }]] = await client.transaction(
        (transaction) =>
          Promise.all([
            transaction
              .with(offered)
              .select()
              .from(offered)
              .where(lacking)
              .orderBy(
                sql`array_position(${categoryOrder}, ${offered.category})`,
                desc(offered.offerCount),
                asc(offered.name),
                asc(offered.id),
              )
              .limit(pageable.getLimit())
              .offset(pageable.getOffset()),
            transaction
              .with(offered)
              .select({ total: count() })
              .from(offered)
              .where(lacking),
          ]),
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );

      const parts = Either.all(
        rows.map((row): Either.Either<PartMissingSpecifications, StructuredError> => {
          const category = Category.withKey(row.category);
          if (category === undefined) {
            return Either.left(
              ServerError.of(
                `A Part has a Category the API does not know: ${row.category}`,
              ),
            );
          }
          const missing = params
            .getNeededOf(category)
            .filter((specification) => row.missing.includes(specification.getPath()));
          return Either.right(
            new PartMissingSpecifications(
              row.id,
              category,
              row.name,
              row.manufacturer,
              missing,
              row.offerCount,
              row.photoId,
            ),
          );
        }),
      );
      return Either.map(
        parts,
        (found) =>
          new PartsMissingSpecificationsPage(found, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, 'The Parts missing specifications could not be listed');
      return Either.left(
        databaseErrorOf(error, 'The Parts missing specifications could not be listed'),
      );
    }
  }

  async readById(id: string): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!couldBeIdentifier(id)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select(partWithPhoto)
        .from(part)
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(eq(part.id, id));

      if (row === undefined) return Either.right(Option.none());
      return Either.map(partOf(row.part, row.photoId), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Part could not be read');
      return Either.left(databaseErrorOf(error, 'A Part could not be read'));
    }
  }
}
