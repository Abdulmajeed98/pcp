import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { checkSpecifications } from '../specification/check-specifications';
import { SpecificationDocument } from '../specification/specification-document';
import { Part } from './Part';
import { partNotFound } from './part-errors';
import { cleanPartNumbers } from './part-numbers';
import { EditPartParams, PartStore } from './PartStore';

class Input {
  constructor(
    private readonly partId: string,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly partNumbers: readonly string[],
    private readonly specifications: SpecificationDocument,
  ) {}

  getPartId(): string {
    return this.partId;
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

export { Input as EditPartCommandInput };
export { Output as EditPartCommandOutput };

// The Admin corrects a Part. An edit replaces the Part's name, manufacturer,
// part numbers and specifications as a whole, as the form sends them, so a
// specification it leaves out is cleared. The Category never changes, and
// the specifications are checked against the Part's own Category's list.
@Injectable()
export class EditPartCommand {
  constructor(private readonly partStore: PartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const found = await this.partStore.readById(input.getPartId());
    if (Either.isLeft(found)) return Either.left(found.left);
    if (Option.isNone(found.right)) return Either.left(partNotFound(input.getPartId()));

    const specifications = checkSpecifications(
      found.right.value.getCategory(),
      input.getSpecifications(),
    );
    if (Either.isLeft(specifications)) return Either.left(specifications.left);

    const edited = await this.partStore.edit(
      new EditPartParams(
        input.getPartId(),
        input.getName(),
        input.getManufacturer(),
        cleanPartNumbers(input.getPartNumbers()),
        specifications.right,
      ),
    );

    return Either.flatMap(edited, (part) =>
      Option.match(part, {
        onNone: () => Either.left(partNotFound(input.getPartId())),
        onSome: (existing) => Either.right(Output.of(existing)),
      }),
    );
  }
}
