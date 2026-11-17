import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Build } from '../build/Build';
import { BuildReading } from '../build/BuildReading';
import { emptyBuildRefused } from './shared-build-errors';
import { ShareOutcome, ShareParams, SharedBuildStore } from './SharedBuildStore';

class Input {
  constructor(private readonly partValues: readonly string[]) {}

  // The `part` values the request gives, as it gives them, before they are
  // read as the Build.
  getPartValues(): readonly string[] {
    return this.partValues;
  }
}

class Output {
  private constructor(private readonly outcome: ShareOutcome) {}

  static of(outcome: ShareOutcome): Output {
    return new Output(outcome);
  }

  // What the share came to: the Shared Build that holds the Build, and
  // whether this share stored it.
  getOutcome(): ShareOutcome {
    return this.outcome;
  }
}

export { Input as ShareBuildCommandInput };
export { Output as ShareBuildCommandOutput };

// The `part` values that write a Build as `GET v1/build` takes it, in the
// Build's order: each Part's identifier, as the catalog writes it in small
// letters, followed for a RAM kit or a drive by `:` and its quantity in
// Western digits.
function partValuesOf(build: Build): string[] {
  return build.getParts().map((part) => {
    const id = part.getPart().getId();
    const quantity = part.getQuantity();
    return quantity === undefined ? id : `${id}:${String(quantity)}`;
  });
}

// Anyone, with no Login, shares a Build: the Parts of it the catalog holds,
// with their quantities, are frozen as a Shared Build, stored once, at now by
// the API's clock (SHR-1). The same Build shared again, its Parts given in
// any order or case, answers the Shared Build already stored, and any change
// answers a new one (SHR-4). Nothing about the Shopper is stored.
@Injectable()
export class ShareBuildCommand {
  constructor(
    private readonly buildReading: BuildReading,
    private readonly sharedBuildStore: SharedBuildStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read as `GET v1/build` reads it, refused as it refuses it, leaving out a
    // Part the catalog does not hold. Its Offers are not needed.
    const build = await this.buildReading.readForTheRules(input.getPartValues());
    if (Either.isLeft(build)) return Either.left(build.left);

    // No Shared Build is empty, so that no link leads to nothing.
    const values = partValuesOf(build.right);
    if (values.length === 0) return Either.left(emptyBuildRefused());

    const outcome = await this.sharedBuildStore.share(new ShareParams(values, new Date()));

    return Either.map(outcome, Output.of);
  }
}
