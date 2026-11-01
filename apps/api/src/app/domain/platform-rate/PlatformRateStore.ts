import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PlatformRate } from './PlatformRate';

// A setting of the Platform Rate: the rate, checked, the time it is set at
// by the API's clock, and the Caller who sets it.
export class SetPlatformRateParams {
  constructor(
    private readonly iqdPerUsd: number,
    private readonly setAt: Date,
    private readonly callerId: string,
  ) {}

  getIqdPerUsd(): number {
    return this.iqdPerUsd;
  }

  getSetAt(): Date {
    return this.setAt;
  }

  // The identifier of the Login the request was made with: the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// Where every setting of the Platform Rate is kept. It is the port: the
// domain says what it needs, and infrastructure provides it.
export abstract class PlatformRateStore {
  // Adds a setting as a new row, also when it is equal to the current one,
  // and answers it as the current Platform Rate. No row is ever changed.
  abstract add(
    params: SetPlatformRateParams,
  ): Promise<Either.Either<PlatformRate, StructuredError>>;

  // The current Platform Rate, the newest setting, or none until the Admin
  // sets the first.
  abstract readCurrent(): Promise<
    Either.Either<Option.Option<PlatformRate>, StructuredError>
  >;
}
