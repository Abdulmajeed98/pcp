import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Build } from './Build';
import { BuildReading } from './BuildReading';
import { Completeness, completenessOf } from './complete-build';
import { Judgment, judgmentOf } from './judgment';

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
    private readonly judgment: Judgment,
  ) {}

  static of(build: Build, completeness: Completeness, judgment: Judgment): Output {
    return new Output(build, completeness, judgment);
  }

  getBuild(): Build {
    return this.build;
  }

  getCompleteness(): Completeness {
    return this.completeness;
  }

  // What the Compatibility Rules find in the Build.
  getJudgment(): Judgment {
    return this.judgment;
  }
}

export { Input as ReadBuildQueryInput };
export { Output as ReadBuildQueryOutput };

// A Build that a request gives, read for anyone, with no Login, and stored
// nowhere: its Parts as the catalog holds them, whether it is a Complete
// Build, what the Compatibility Rules find in it and its Estimated power
// draw (BLD-1, BLD-4, BLD-5, CMP-5).
@Injectable()
export class ReadBuildQuery {
  constructor(private readonly buildReading: BuildReading) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Part's visibility is judged at one moment.
    const now = new Date();
    const build = await this.buildReading.read(input.getPartValues(), now);

    return Either.map(build, (read) =>
      Output.of(read, completenessOf(read), judgmentOf(read)),
    );
  }
}
