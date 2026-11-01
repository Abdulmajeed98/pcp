import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { checkIqdPerUsd, PlatformRate } from './PlatformRate';
import { PlatformRateStore, SetPlatformRateParams } from './PlatformRateStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly iqdPerUsd: unknown,
  ) {}

  // The identifier of the Login the request was made with: the Admin's.
  getCallerId(): string {
    return this.callerId;
  }

  // The rate as it was sent, before it is checked: any JSON value, or
  // undefined when it was left out.
  getIqdPerUsd(): unknown {
    return this.iqdPerUsd;
  }
}

class Output {
  private constructor(private readonly rate: PlatformRate) {}

  static of(rate: PlatformRate): Output {
    return new Output(rate);
  }

  // The Platform Rate as it now stands.
  getRate(): PlatformRate {
    return this.rate;
  }
}

export { Input as SetPlatformRateCommandInput };
export { Output as SetPlatformRateCommandOutput };

// The Admin sets the Platform Rate (PRC-1). Every setting is kept, with its
// time by the API's clock and the Admin's Login, and the newest is the
// current Platform Rate.
@Injectable()
export class SetPlatformRateCommand {
  constructor(private readonly platformRateStore: PlatformRateStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const iqdPerUsd = checkIqdPerUsd(input.getIqdPerUsd());
    if (Either.isLeft(iqdPerUsd)) return Either.left(iqdPerUsd.left);

    // The API's clock, never the database's, gives the time of a setting, so
    // that a test moves time by moving the API's clock.
    const set = await this.platformRateStore.add(
      new SetPlatformRateParams(iqdPerUsd.right, new Date(), input.getCallerId()),
    );

    return Either.map(set, Output.of);
  }
}
