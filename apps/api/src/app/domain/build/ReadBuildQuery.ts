import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Build } from './Build';
import { BuildReading } from './BuildReading';

class Input {
  constructor(private readonly partValues: readonly string[]) {}

  // The `part` values the request gives, as it gives them, before they are
  // read as the Build.
  getPartValues(): readonly string[] {
    return this.partValues;
  }
}

class Output {
  private constructor(private readonly build: Build) {}

  static of(build: Build): Output {
    return new Output(build);
  }

  getBuild(): Build {
    return this.build;
  }
}

export { Input as ReadBuildQueryInput };
export { Output as ReadBuildQueryOutput };

// A Build that a request gives, read for anyone, with no Login, and stored
// nowhere: its Parts as the catalog holds them (BLD-1).
@Injectable()
export class ReadBuildQuery {
  constructor(private readonly buildReading: BuildReading) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Part's visibility is judged at one moment.
    const now = new Date();
    const build = await this.buildReading.read(input.getPartValues(), now);

    return Either.map(build, Output.of);
  }
}
