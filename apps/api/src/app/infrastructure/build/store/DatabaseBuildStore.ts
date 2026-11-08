import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { eq, inArray, sql } from 'drizzle-orm';
import { Either } from 'effect';

import { BuildStore, CatalogPart } from '~/domain/build/BuildStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { visiblePart } from '~/infrastructure/offer/visible-offer';
import { part } from '~/infrastructure/part/part.schema';
import { partOf, partWithPhoto } from '~/infrastructure/part/part-of-row';
import { partPhoto } from '~/infrastructure/photo/photo.schema';

// The Parts a Build names, read from the database, each with whether it is a
// Visible Part by `visiblePart(now)`.
@Injectable()
export class DatabaseBuildStore implements BuildStore {
  private readonly logger = new Logger(DatabaseBuildStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async readParts(
    partIds: readonly string[],
    now: Date,
  ): Promise<Either.Either<readonly CatalogPart[], StructuredError>> {
    if (partIds.length === 0) return Either.right([]);

    try {
      const rows = await this.databaseProvider
        .getClient()
        .select({ ...partWithPhoto, visible: sql<boolean>`${visiblePart(now)}` })
        .from(part)
        .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
        .where(inArray(part.id, [...partIds]));

      return Either.all(
        rows.map((row) =>
          Either.map(
            partOf(row.part, row.photoId),
            (found) => new CatalogPart(found, row.visible),
          ),
        ),
      );
    } catch (error) {
      this.logger.error(error, "A Build's Parts could not be read");
      return Either.left(databaseErrorOf(error, "A Build's Parts could not be read"));
    }
  }
}
