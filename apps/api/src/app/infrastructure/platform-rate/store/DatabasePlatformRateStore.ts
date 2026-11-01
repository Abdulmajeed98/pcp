import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, StructuredError } from '@pcp/core';
import { desc } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { PlatformRate } from '~/domain/platform-rate/PlatformRate';
import {
  PlatformRateStore,
  SetPlatformRateParams,
} from '~/domain/platform-rate/PlatformRateStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';

import { platformRate, PlatformRateRow } from '../platform-rate.schema';

// A row as the Platform Rate it set.
function toDomain(row: PlatformRateRow): PlatformRate {
  return new PlatformRate(row.iqdPerUsd, row.setAt);
}

@Injectable()
export class DatabasePlatformRateStore implements PlatformRateStore {
  private readonly logger = new Logger(DatabasePlatformRateStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async add(
    params: SetPlatformRateParams,
  ): Promise<Either.Either<PlatformRate, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .insert(platformRate)
        .values({
          iqdPerUsd: params.getIqdPerUsd(),
          setAt: params.getSetAt(),
          setBy: params.getCallerId(),
        })
        .returning();

      return Either.right(toDomain(row));
    } catch (error) {
      this.logger.error(error, 'The Platform Rate could not be set');
      return Either.left(databaseErrorOf(error, 'The Platform Rate could not be set'));
    }
  }

  async readCurrent(): Promise<
    Either.Either<Option.Option<PlatformRate>, StructuredError>
  > {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select()
        .from(platformRate)
        // The newest setting, and of two set at the same moment the one added
        // later.
        .orderBy(desc(platformRate.setAt), desc(platformRate.id))
        .limit(1);

      return Either.right(Option.fromNullable(row).pipe(Option.map(toDomain)));
    } catch (error) {
      this.logger.error(error, 'The Platform Rate could not be read');
      return Either.left(databaseErrorOf(error, 'The Platform Rate could not be read'));
    }
  }
}
