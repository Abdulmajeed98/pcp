import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import {
  CatalogImportStore,
  ImportPartParams,
} from '~/domain/catalog-import/CatalogImportStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { part } from '~/infrastructure/part/part.schema';
import { searchTextOf } from '~/infrastructure/part/search-text';

// The most rows one statement writes. PostgreSQL takes at most 65,535 values
// in a statement, and each row has seven.
const largestBatch = 1000;

// The Parts in batches of at most the largest size, in the order they were
// given.
function batchesOf(parts: readonly ImportPartParams[]): ImportPartParams[][] {
  const batches: ImportPartParams[][] = [];
  for (let start = 0; start < parts.length; start += largestBatch) {
    batches.push(parts.slice(start, start + largestBatch));
  }
  return batches;
}

// What the database said, rather than Drizzle's wrapping of it, which holds
// the whole statement and every value in it.
function reasonOf(error: unknown): string {
  const { cause, message } = error as { cause?: { message?: unknown }; message?: unknown };
  if (typeof cause?.message === 'string') return cause.message;
  return typeof message === 'string' ? message : String(error);
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
          for (const batch of batchesOf(parts)) {
            // A Part whose OpenDB ID is already in the catalog is skipped, and
            // never changed.
            const rows = await transaction
              .insert(part)
              .values(
                batch.map((each) => ({
                  openDbId: each.getOpenDbId(),
                  category: each.getCategory().getKey(),
                  name: each.getName(),
                  manufacturer: each.getManufacturer(),
                  partNumbers: [...each.getPartNumbers()],
                  specifications: each.getSpecifications(),
                  searchText: searchTextOf(
                    each.getName(),
                    each.getManufacturer(),
                    each.getPartNumbers(),
                  ),
                })),
              )
              .onConflictDoNothing({ target: part.openDbId })
              .returning({ openDbId: part.openDbId });
            for (const row of rows) {
              if (row.openDbId !== null) openDbIds.add(row.openDbId);
            }
          }
          return openDbIds;
        });
      return Either.right(created);
    } catch (error) {
      const message = `The catalog could not be written, and nothing was imported: ${reasonOf(error)}`;
      this.logger.error(error, message);
      return Either.left(databaseErrorOf(error, message));
    }
  }
}
