import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from '../part/Category';
import { SpecificationDocument } from '../specification/specification-document';

// A Part as the import makes it of one of OpenDB's records.
export class ImportPartParams {
  constructor(
    private readonly openDbId: string,
    private readonly category: Category,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly partNumbers: readonly string[],
    private readonly specifications: SpecificationDocument,
  ) {}

  getOpenDbId(): string {
    return this.openDbId;
  }

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

// Where the import writes the catalog. It is the port: the domain says what
// it needs, and infrastructure provides it.
export abstract class CatalogImportStore {
  // Creates every Part whose OpenDB ID the catalog does not hold yet, all in
  // one transaction, and gives the OpenDB IDs of those it created. A Part the
  // catalog already holds is left exactly as it is. When anything fails,
  // nothing is created.
  abstract importParts(
    parts: readonly ImportPartParams[],
  ): Promise<Either.Either<ReadonlySet<string>, StructuredError>>;
}
