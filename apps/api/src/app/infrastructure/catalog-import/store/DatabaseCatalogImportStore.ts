import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import {
  CatalogImportStore,
  ImportPartParams,
} from '~/domain/catalog-import/CatalogImportStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { part } from '~/infrastructure/part/part.schema';
import { columnsOf } from '~/infrastructure/part/part-columns';

// A failure to write one record's Part, and which record it was.
class RecordNotWritten extends Error {
  constructor(
    readonly openDbId: string,
    override readonly cause: unknown,
  ) {
    super(`The record with OpenDB ID ${openDbId} could not be written`);
  }
}

// What went wrong at the bottom, rather than Drizzle's wrapping of it, which
// holds the whole statement and every value in it. Node gives a connection it
// tried at several addresses as an error of errors, with no message of its
// own.
function reasonOf(error: unknown): string {
  const { cause, message, errors } = error as {
    cause?: unknown;
    message?: unknown;
    errors?: unknown;
  };
  if (cause !== undefined) return reasonOf(cause);
  if (typeof message === 'string' && message !== '') return message;
  if (Array.isArray(errors)) return errors.map(reasonOf).join('; ');
  return String(error);
}

@Injectable()
export class DatabaseCatalogImportStore implements CatalogImportStore {
  private readonly logger = new Logger(DatabaseCatalogImportStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async importParts(
    parts: readonly ImportPartParams[],
  ): Promise<Either.Either<ReadonlySet<string>, StructuredError>> {
    try {
      const created = await this.databaseProvider
        .getClient()
        .transaction(async (transaction) => {
          const openDbIds = new Set<string>();
          // One statement for each Part, so that a failure names its record.
          for (const each of parts) {
            try {
              // A Part whose OpenDB ID is already in the catalog is skipped,
              // and never changed.
              const [row] = await transaction
                .insert(part)
                .values({
                  openDbId: each.getOpenDbId(),
                  category: each.getCategory().getKey(),
                  ...columnsOf(each),
                })
                .onConflictDoNothing({ target: part.openDbId })
                .returning({ openDbId: part.openDbId });
              if (row?.openDbId) openDbIds.add(row.openDbId);
            } catch (error) {
              throw new RecordNotWritten(each.getOpenDbId(), error);
            }
          }
          return openDbIds;
        });
      return Either.right(created);
    } catch (error) {
      const record =
        error instanceof RecordNotWritten
          ? `the record with OpenDB ID ${error.openDbId} was not taken: `
          : '';
      const message = `The catalog could not be written, and nothing was imported: ${record}${reasonOf(error)}`;
      this.logger.error(error, message);
      return Either.left(databaseErrorOf(error, message));
    }
  }
}
