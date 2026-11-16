import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { sharedBuildNotFound } from './shared-build-errors';
import { SharedBuild } from './SharedBuild';
import { SharedBuildStore } from './SharedBuildStore';

class Input {
  constructor(private readonly sharedBuildId: string) {}

  getSharedBuildId(): string {
    return this.sharedBuildId;
  }
}

class Output {
  private constructor(private readonly sharedBuild: SharedBuild) {}

  static of(sharedBuild: SharedBuild): Output {
    return new Output(sharedBuild);
  }

  getSharedBuild(): SharedBuild {
    return this.sharedBuild;
  }
}

export { Input as ReadSharedBuildQueryInput };
export { Output as ReadSharedBuildQueryOutput };

// Anyone, with no Login, reads a Shared Build: its frozen `part` values, as
// they were shared, and when. Its prices and its rules are today's, read by
// handing the values to `GET v1/build` (SHR-2), so nothing of them is stored
// or answered here.
@Injectable()
export class ReadSharedBuildQuery {
  constructor(private readonly sharedBuildStore: SharedBuildStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const id = input.getSharedBuildId();
    const found = await this.sharedBuildStore.readById(id);

    return Either.flatMap(found, (sharedBuild) =>
      Either.fromOption(sharedBuild, () => sharedBuildNotFound(id)).pipe(
        Either.map(Output.of),
      ),
    );
  }
}
