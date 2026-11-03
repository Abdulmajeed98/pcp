import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PlatformRate } from './PlatformRate';
import { PlatformRateStore } from './PlatformRateStore';

// The read asks for nothing: there is one Platform Rate.
class Input {}

class Output {
  private constructor(private readonly current: Option.Option<PlatformRate>) {}

  static of(current: Option.Option<PlatformRate>): Output {
    return new Output(current);
  }

  // The current Platform Rate, or none until the Admin sets the first.
  getCurrent(): Option.Option<PlatformRate> {
    return this.current;
  }
}

export { Input as ReadPlatformRateQueryInput };
export { Output as ReadPlatformRateQueryOutput };

// The current Platform Rate and when it was set, for the Admin (PRC-1).
@Injectable()
export class ReadPlatformRateQuery {
  constructor(private readonly platformRateStore: PlatformRateStore) {}

  async execute(_input: Input): Promise<Either.Either<Output, StructuredError>> {
    const current = await this.platformRateStore.readCurrent();

    return Either.map(current, Output.of);
  }
}
