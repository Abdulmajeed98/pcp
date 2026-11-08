import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Build } from './Build';
import { BuildReading } from './BuildReading';
import { Completeness, completenessOf } from './complete-build';

class Input {
  constructor(private readonly partValues: readonly string[]) {}

  // The `part` values the request gives, as it gives them, before they are
  // read as the Build.
  getPartValues(): readonly string[] {
    return this.partValues;
  }
}

class Output {
  private constructor(
    private readonly build: Build,
    private readonly completeness: Completeness,
  ) {}

  static of(build: Build, completeness: Completeness): Output {
    return new Output(build, completeness);
  }

  getBuild(): Build {
    return this.build;
  }

  getCompleteness(): Completeness {
    return this.completeness;
  }
}

export { Input as ReadBuildQueryInput };
export { Output as ReadBuildQueryOutput };

// A Build that a request gives, read for anyone, with no Login, and stored
// nowhere: its Parts as the catalog holds them, and whether it is a Complete
// Build (BLD-1, BLD-5).
@Injectable()
export class ReadBuildQuery {
  constructor(private readonly buildReading: BuildReading) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Part's visibility is judged at one moment.
    const now = new Date();
    const build = await this.buildReading.read(input.getPartValues(), now);

    return Either.map(build, (read) => Output.of(read, completenessOf(read)));
  }
}
