import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { eq } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { PhotoStore } from '~/domain/photo/PhotoStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';

import { couldBeIdentifier } from '../database/identifiers';
import { partPhoto } from './photo.schema';

@Injectable()
export class DatabasePhotoStore implements PhotoStore {
  private readonly logger = new Logger(DatabasePhotoStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  // The old photo is deleted and the new one stored in one transaction, so a
  // Part never has two and never loses its photo to a failure halfway.
  async replaceForPart(
    partId: string,
    image: Buffer,
  ): Promise<Either.Either<string, StructuredError>> {
    try {
      const id = await this.databaseProvider
        .getClient()
        .transaction(async (transaction) => {
          await transaction.delete(partPhoto).where(eq(partPhoto.partId, partId));
          const [row] = await transaction
            .insert(partPhoto)
            .values({ partId, image })
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
