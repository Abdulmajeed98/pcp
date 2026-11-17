import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, ServerError, StructuredError } from '@pcp/core';
import { eq } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { SharedBuild } from '~/domain/shared-build/SharedBuild';
import {
  ShareOutcome,
  ShareParams,
  SharedBuildStore,
} from '~/domain/shared-build/SharedBuildStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';

import { sharedBuild, SharedBuildRow } from '../shared-build.schema';

// The `part` values as the one text the row holds, and the text as the
// values again. A value holds no comma: it is an identifier, and a quantity
// after a colon.
function textOf(partValues: readonly string[]): string {
  return partValues.join(',');
}
function partValuesIn(text: string): string[] {
  return text.split(',');
}

// A row as the Shared Build it holds.
function toDomain(row: SharedBuildRow): SharedBuild {
  return new SharedBuild(row.id, partValuesIn(row.partValues), row.sharedAt);
}

@Injectable()
export class DatabaseSharedBuildStore implements SharedBuildStore {
  private readonly logger = new Logger(DatabaseSharedBuildStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async share(params: ShareParams): Promise<Either.Either<ShareOutcome, StructuredError>> {
    const text = textOf(params.getPartValues());
    const client = this.databaseProvider.getClient();
    try {
      // The unique rule alone decides whether this share stores the Build,
      // with no read before: a share that meets the rule stores nothing, and
      // waits until the share it met is done, so that the Shared Build it
      // then reads is stored, even when two shares of one Build arrive at
      // once.
      const [stored] = await client
        .insert(sharedBuild)
        .values({ partValues: text, sharedAt: params.getSharedAt() })
        .onConflictDoNothing({ target: sharedBuild.partValues })
        .returning();
      if (stored !== undefined)
        return Either.right(new ShareOutcome(toDomain(stored), true));

      const [earlier] = await client
        .select()
        .from(sharedBuild)
        .where(eq(sharedBuild.partValues, text));
      if (earlier === undefined) {
        return Either.left(
          ServerError.of('A Build met a Shared Build that could not be read back'),
        );
      }
      return Either.right(new ShareOutcome(toDomain(earlier), false));
    } catch (error) {
      this.logger.error(error, 'A Build could not be shared');
      return Either.left(databaseErrorOf(error, 'A Build could not be shared'));
    }
  }

  async readById(
    id: string,
  ): Promise<Either.Either<Option.Option<SharedBuild>, StructuredError>> {
    if (!couldBeIdentifier(id)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select()
        .from(sharedBuild)
        .where(eq(sharedBuild.id, id));

      return Either.right(Option.fromNullable(row).pipe(Option.map(toDomain)));
    } catch (error) {
      this.logger.error(error, 'A Shared Build could not be read');
      return Either.left(databaseErrorOf(error, 'A Shared Build could not be read'));
    }
  }
}
