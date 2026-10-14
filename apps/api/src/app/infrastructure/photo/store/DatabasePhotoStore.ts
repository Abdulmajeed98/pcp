import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { eq } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { PhotoStore } from '~/domain/photo/PhotoStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { part } from '~/infrastructure/part/part.schema';

import { partPhoto } from '../photo.schema';

@Injectable()
export class DatabasePhotoStore implements PhotoStore {
  private readonly logger = new Logger(DatabasePhotoStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  // The old photo is deleted and the new one stored in one transaction, so a
  // Part never has two and never loses its photo to a failure halfway. The
  // Part's row is locked first, so that two replacements sent at once, as by
  // a double tap, wait for each other rather than collide.
  async replaceForPart(
    partId: string,
    photo: Buffer,
  ): Promise<Either.Either<string, StructuredError>> {
    try {
      const id = await this.databaseProvider
        .getClient()
        .transaction(async (transaction) => {
          await transaction
            .select({ id: part.id })
            .from(part)
            .where(eq(part.id, partId))
            .for('update');
          await transaction.delete(partPhoto).where(eq(partPhoto.partId, partId));
          const [row] = await transaction
            .insert(partPhoto)
            .values({ partId, image: photo })
            .returning({ id: partPhoto.id });
          return row.id;
        });
      return Either.right(id);
    } catch (error) {
      this.logger.error(error, "A Part's photo could not be stored");
      return Either.left(databaseErrorOf(error, "A Part's photo could not be stored"));
    }
  }

  async readById(
    photoId: string,
  ): Promise<Either.Either<Option.Option<Buffer>, StructuredError>> {
    if (!couldBeIdentifier(photoId)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select({ image: partPhoto.image })
        .from(partPhoto)
        .where(eq(partPhoto.id, photoId));
      return Either.right(Option.fromNullable(row?.image));
    } catch (error) {
      this.logger.error(error, 'A photo could not be read');
      return Either.left(databaseErrorOf(error, 'A photo could not be read'));
    }
  }
}
