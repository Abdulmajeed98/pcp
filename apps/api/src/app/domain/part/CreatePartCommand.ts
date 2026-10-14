import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { checkSpecifications } from '../specification/check-specifications';
import { SpecificationDocument } from '../specification/specification-document';
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
    private readonly specifications: SpecificationDocument,
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

  getSpecifications(): SpecificationDocument {
    return this.specifications;
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
    const specifications = checkSpecifications(
      input.getCategory(),
      input.getSpecifications(),
    );
    if (Either.isLeft(specifications)) return Either.left(specifications.left);

    const created = await this.partStore.create(
      new CreatePartParams(
        input.getCategory(),
        input.getName(),
        input.getManufacturer(),
        cleanPartNumbers(input.getPartNumbers()),
        specifications.right,
      ),
    );

    return Either.map(created, Output.of);
  }
}
