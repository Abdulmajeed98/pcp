import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PlatformRate } from './PlatformRate';

// Where every setting of the Platform Rate is kept. It is the port: the
// domain says what it needs, and infrastructure provides it.
export abstract class PlatformRateStore {
  // The current Platform Rate, the newest setting, or none until the Admin
  // sets the first.
  abstract readCurrent(): Promise<
    Either.Either<Option.Option<PlatformRate>, StructuredError>
  >;
}
