import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, PageAttributes, ServerError, StructuredError } from '@pcp/core';
import { and, asc, count, eq, ilike, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';
import {
  CreatePartParams,
  EditPartParams,
  PartsPage,
  PartStore,
  SearchPartsParams,
} from '~/domain/part/PartStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';

import { part, PartRow } from '../part.schema';

// Whether an identifier has the form the database holds. Anything else names
// no Part, and is never sent to the database, which would refuse it.
function couldBePartId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// A row as a Part. The database's own list of Categories is made from the
// domain's, so a row whose Category the domain does not know means the two
// have drifted apart.
function toDomain(row: PartRow): Either.Either<Part, StructuredError> {
  const category = Category.withKey(row.category);
  if (category === undefined) {
    return Either.left(
      ServerError.of(`A Part has a Category the API does not know: ${row.category}`),
    );
  }

  return Either.right(
    new Part(
      row.id,
      category,
      row.name,
      row.manufacturer,
      row.partNumbers,
      row.openDbId,
      row.specifications,
      row.createdAt,
      row.updatedAt,
    ),
  );
}

// What a search looks in: the name, the manufacturer and the part numbers,
// in lower case. It is stored beside them, because an index cannot be made on
// the list of part numbers joined in a query.
function searchTextOf(
  name: string,
  manufacturer: string,
  partNumbers: readonly string[],
): string {
  return [name, manufacturer, ...partNumbers].join(' ').toLowerCase();
}

// A word to be found anywhere in the search text. Its `%`, `_` and `\` are
// taken as themselves and not as parts of a pattern.
function containing(word: string): string {
  return `%${word.toLowerCase().replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

@Injectable()
export class DatabasePartStore implements PartStore {
  private readonly logger = new Logger(DatabasePartStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async create(params: CreatePartParams): Promise<Either.Either<Part, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .insert(part)
        .values({
          category: params.getCategory().getKey(),
          name: params.getName(),
          manufacturer: params.getManufacturer(),
          partNumbers: [...params.getPartNumbers()],
          specifications: params.getSpecifications(),
          searchText: searchTextOf(
            params.getName(),
            params.getManufacturer(),
            params.getPartNumbers(),
          ),
        })
        .returning();

      return toDomain(row);
    } catch (error) {
      this.logger.error(error, 'A Part could not be created');
      return Either.left(databaseErrorOf(error, 'A Part could not be created'));
    }
  }

  async edit(
    params: EditPartParams,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!couldBePartId(params.getPartId())) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .update(part)
        .set({
          name: params.getName(),
          manufacturer: params.getManufacturer(),
          partNumbers: [...params.getPartNumbers()],
          specifications: params.getSpecifications(),
          searchText: searchTextOf(
            params.getName(),
            params.getManufacturer(),
            params.getPartNumbers(),
          ),
        })
        .where(eq(part.id, params.getPartId()))
        .returning();

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Part could not be edited');
      return Either.left(databaseErrorOf(error, 'A Part could not be edited'));
    }
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
      const client = this.databaseProvider.getClient();
      const [rows, [{ total }]] = await Promise.all([
        client
          .select()
          .from(part)
          .where(where)
          .orderBy(asc(part.name), asc(part.id))
          .limit(pageable.getLimit())
          .offset(pageable.getOffset()),
        client.select({ total: count() }).from(part).where(where),
      ]);

      const parts = Either.all(rows.map(toDomain));
      return Either.map(
        parts,
        (found) => new PartsPage(found, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, 'The catalog could not be searched');
      return Either.left(databaseErrorOf(error, 'The catalog could not be searched'));
    }
  }

  async readById(id: string): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!couldBePartId(id)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select()
        .from(part)
        .where(eq(part.id, id));

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Part could not be read');
      return Either.left(databaseErrorOf(error, 'A Part could not be read'));
    }
  }
}
