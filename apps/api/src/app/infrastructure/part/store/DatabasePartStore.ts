import { Injectable, Logger } from '@nestjs/common';
import { ServerError, StructuredError } from '@pcp/core';
import { eq } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';
import { CreatePartParams, PartStore } from '~/domain/part/PartStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';

import { part, PartRow } from '../part.schema';

// The form of an identifier the database can hold. Anything else names no
// Part, and is never sent to the database, which would refuse it.
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toDomain(row: PartRow): Part {
  const category = Category.withKey(row.category);
  if (category === undefined) {
    throw new Error(`The database holds a Category the API does not know: ${row.category}`);
  }

  return new Part(
    row.id,
    category,
    row.name,
    row.manufacturer,
    row.partNumbers,
    row.openDbId,
  );
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
          category: params.getCategory().getKey() as PartRow['category'],
          name: params.getName(),
          manufacturer: params.getManufacturer(),
          partNumbers: [...params.getPartNumbers()],
        })
        .returning();

      return Either.right(toDomain(row));
    } catch (error) {
      this.logger.error(error, 'A Part could not be created');
      return Either.left(ServerError.of('A Part could not be created'));
    }
  }

  async readById(id: string): Promise<Either.Either<Option.Option<Part>, StructuredError>> {
    if (!uuidPattern.test(id)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select()
        .from(part)
        .where(eq(part.id, id));

      return Either.right(Option.fromNullable(row).pipe(Option.map(toDomain)));
    } catch (error) {
      this.logger.error(error, 'A Part could not be read');
      return Either.left(ServerError.of('A Part could not be read'));
    }
  }
}
