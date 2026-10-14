import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Category } from './Category';
import { Part } from './Part';

export class CreatePartParams {
  constructor(
    private readonly category: Category,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly partNumbers: readonly string[],
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getName(): string {
    return this.name;
  }

  getManufacturer(): string {
    return this.manufacturer;
  }

  getPartNumbers(): readonly string[] {
    return this.partNumbers;
  }
}

// Where Parts are kept. It is the port: the domain says what it needs, and
// infrastructure provides it.
export abstract class PartStore {
  abstract create(params: CreatePartParams): Promise<Either.Either<Part, StructuredError>>;

  // The Part with this identifier, or none when there is no such Part.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>>;
}
