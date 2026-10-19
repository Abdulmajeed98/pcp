import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, PageAttributes, StructuredError } from '@pcp/core';
import { and, asc, count, eq, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { Part } from '~/domain/part/Part';
import {
  CreatePartParams,
  EditPartParams,
  PartsPage,
  PartStore,
  SearchPartsParams,
} from '~/domain/part/PartStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { partPhoto } from '~/infrastructure/photo/photo.schema';

import { part } from '../part.schema';
import { columnsOf } from '../part-columns';
import { partOf, partWithPhoto } from '../part-of-row';
import { holdingEveryWord } from '../search-text';

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
    const conditions: SQL[] = holdingEveryWord(params.getWords());
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
