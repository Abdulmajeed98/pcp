import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { PlatformFigures } from './PlatformFigures';

// Where the platform's figures are read, for the Shopper app's home page and
// a Part's price slip. It is the port: the domain says what it needs, and
// infrastructure provides it.
export abstract class PlatformFiguresStore {
  // The platform's figures at now by the API's clock: how many active Vendors
  // it has, how many visible Offers it lists, by the rule in
  // `visibility.ts`, and the current Platform Rate's value, or none until the
  // Admin sets the first. All three are read in one query, so that one
  // answer never mixes two moments.
  abstract readPlatformFigures(
    now: Date,
  ): Promise<Either.Either<PlatformFigures, StructuredError>>;
}
