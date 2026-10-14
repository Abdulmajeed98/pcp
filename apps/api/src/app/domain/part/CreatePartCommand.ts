import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from './Category';
import { Part } from './Part';
import { cleanPartNumbers } from './part-numbers';
import { CreatePartParams, PartStore } from './PartStore';

class Input {
  constructor(
    private readonly category: Category,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly partNumbers: readonly string[],
  ) {}

  toStoreParams(): CreatePartParams {
    return new CreatePartParams(
      this.category,
      this.name,
      this.manufacturer,
      cleanPartNumbers(this.partNumbers),
    );
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

export { Input as CreatePartCommandInput };
export { Output as CreatePartCommandOutput };

// The Admin adds a Part to the catalog.
@Injectable()
export class CreatePartCommand {
  constructor(private readonly partStore: PartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const created = await this.partStore.create(input.toStoreParams());

    return Either.map(created, Output.of);
  }
}
