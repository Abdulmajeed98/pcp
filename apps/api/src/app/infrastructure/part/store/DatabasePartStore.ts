import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, ServerError, StructuredError } from '@pcp/core';
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
    new Part(row.id, category, row.name, row.manufacturer, row.partNumbers, row.openDbId),
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
          category: params.getCategory().getKey(),
          name: params.getName(),
          manufacturer: params.getManufacturer(),
          partNumbers: [...params.getPartNumbers()],
        })
        .returning();

      return toDomain(row);
    } catch (error) {
      this.logger.error(error, 'A Part could not be created');
      return Either.left(databaseErrorOf(error, 'A Part could not be created'));
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

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Part could not be read');
      return Either.left(databaseErrorOf(error, 'A Part could not be read'));
    }
  }
}
