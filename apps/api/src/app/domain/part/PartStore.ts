import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { SpecificationDocument } from '../specification/specification-document';
import { Category } from './Category';
import { Part } from './Part';

export class CreatePartParams {
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

// What an edit replaces. The Category, the OpenDB ID and the time the Part was
// created are not among it.
export class EditPartParams {
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

// What a search asks for: the words every Part found holds, an optional
// Category, and the page.
export class SearchPartsParams {
  constructor(
    private readonly words: readonly string[],
    private readonly category: Category | undefined,
    private readonly pageable: PageableAttributes,
  ) {}

  getWords(): readonly string[] {
    return this.words;
  }

  getCategory(): Category | undefined {
    return this.category;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

// One page of the Parts a search found, in name order, and where the page
// stands among them all.
export class PartsPage {
  constructor(
    private readonly parts: readonly Part[],
    private readonly page: PageAttributes,
  ) {}

  getParts(): readonly Part[] {
    return this.parts;
  }

  getPage(): PageAttributes {
    return this.page;
  }
}

// Where Parts are kept. It is the port: the domain says what it needs, and
// infrastructure provides it.
export abstract class PartStore {
  abstract create(params: CreatePartParams): Promise<Either.Either<Part, StructuredError>>;

  // Replaces what the params hold and gives the Part as it now is, or none
  // when there is no such Part.
  abstract edit(
    params: EditPartParams,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>>;

  // The Parts that hold every word in their name, manufacturer or part
  // numbers, regardless of case, ordered by name and then by identifier, so
  // that moving between pages never skips or repeats one.
  abstract search(
    params: SearchPartsParams,
  ): Promise<Either.Either<PartsPage, StructuredError>>;

  // The Part with this identifier, or none when there is no such Part.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>>;
}
