import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Part } from './Part';
import { partNotFound } from './part-errors';
import { PartStore } from './PartStore';

class Input {
  constructor(private readonly partId: string) {}

  getPartId(): string {
    return this.partId;
  }
}

class Output {
  private constructor(private readonly part: Part) {}

  static of(part: Part): Output {
    return new Output(part);
  }

  getPart(): Part {
    return this.part;
  }
}

export { Input as ReadPartQueryInput };
export { Output as ReadPartQueryOutput };

// One Part, by its identifier.
@Injectable()
export class ReadPartQuery {
  constructor(private readonly partStore: PartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const found = await this.partStore.readById(input.getPartId());

    return Either.flatMap(found, (part) =>
      Option.match(part, {
        onNone: () => Either.left(partNotFound(input.getPartId())),
        onSome: (existing) => Either.right(Output.of(existing)),
      }),
    );
  }
}
