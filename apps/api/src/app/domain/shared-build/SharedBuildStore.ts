import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { SharedBuild } from './SharedBuild';

// A Build to share: its frozen `part` values, and the moment it is shared.
export class ShareParams {
  constructor(
    private readonly partValues: readonly string[],
    private readonly sharedAt: Date,
  ) {}

  getPartValues(): readonly string[] {
    return this.partValues;
  }

  getSharedAt(): Date {
    return this.sharedAt;
  }
}

// The Shared Build that holds a Build, and whether this share stored it or
// found it stored by an earlier one.
export class Shared {
  constructor(
    private readonly sharedBuild: SharedBuild,
    private readonly storedNow: boolean,
  ) {}

  getSharedBuild(): SharedBuild {
    return this.sharedBuild;
  }

  isStoredNow(): boolean {
    return this.storedNow;
  }
}

// Where Shared Builds are kept. It is the port: the domain says what it
// needs, and infrastructure provides it. A Shared Build is only ever added,
// never changed or deleted.
export abstract class SharedBuildStore {
  // Stores the Shared Build of these `part` values, shared at the moment
  // given, or answers the one that already holds them, as it was stored. The
  // values are unique: the store alone decides whether they are stored, so
  // that two shares of one Build at once make one Shared Build.
  abstract share(params: ShareParams): Promise<Either.Either<Shared, StructuredError>>;

  // The Shared Build with this identifier, or none when there is no such
  // Shared Build, as for a text that is not an identifier.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<SharedBuild>, StructuredError>>;
}
