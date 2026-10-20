import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Specification } from '../specification/Specification';
import { SpecificationDocument } from '../specification/specification-document';
import { Category } from './Category';
import { Part } from './Part';
import { PartMissingSpecifications } from './PartMissingSpecifications';

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
// Category, the page, and the Vendor whose Offers the search names, if any.
export class SearchPartsParams {
  constructor(
    private readonly words: readonly string[],
    private readonly category: Category | undefined,
    private readonly pageable: PageableAttributes,
    private readonly offersOf: Option.Option<string>,
  ) {}

  // The identifier of the Vendor whose Offer for each Part found the page
  // names, or none, when it names no Vendor's.
  getOffersOf(): Option.Option<string> {
    return this.offersOf;
  }

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
// stands among them all, with the identifier of the Offer that the Vendor the
// search was asked for has for each Part, by the Part's identifier.
export class PartsPage {
  constructor(
    private readonly parts: readonly Part[],
    private readonly page: PageAttributes,
    private readonly offerIds: ReadonlyMap<string, string>,
  ) {}

  getParts(): readonly Part[] {
    return this.parts;
  }

  // The Vendor's Offer for the Part, or none, when the Vendor has none or the
  // search named no Vendor.
  getOfferIdOf(part: Part): Option.Option<string> {
    return Option.fromNullable(this.offerIds.get(part.getId()));
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// What the list of Parts missing specifications asks for: the needed
// specifications of each Category, as its list in code names them, and the
// page.
export class ListPartsMissingSpecificationsParams {
  constructor(
    private readonly needed: ReadonlyMap<Category, readonly Specification[]>,
    private readonly pageable: PageableAttributes,
  ) {}

  // The needed specifications of a Category, in its list's order.
  getNeededOf(category: Category): readonly Specification[] {
    return this.needed.get(category) ?? [];
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

// One page of the Parts missing specifications, and where the page stands
// among them all.
export class PartsMissingSpecificationsPage {
  constructor(
    private readonly parts: readonly PartMissingSpecifications[],
    private readonly page: PageAttributes,
  ) {}

  getParts(): readonly PartMissingSpecifications[] {
    return this.parts;
  }

  getPageAttributes(): PageAttributes {
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
  // that moving between pages never skips or repeats one. When the params name
  // a Vendor, the page names that Vendor's Offer for each Part it has one for,
  // and never another Vendor's.
  abstract search(
    params: SearchPartsParams,
  ): Promise<Either.Either<PartsPage, StructuredError>>;

  // The Parts that have at least one Offer, from any Vendor, and in whose
  // specifications at least one of their Category's needed specifications is
  // missing, as `Specification.isMissingIn` says. The database decides which
  // are missing, so that the page and its total agree. They are ordered by
  // Category, in the order of the eight, then by their count of Offers, most
  // first, then by name and identifier, so that moving between pages never
  // skips or repeats one.
  abstract listMissingSpecifications(
    params: ListPartsMissingSpecificationsParams,
  ): Promise<Either.Either<PartsMissingSpecificationsPage, StructuredError>>;

  // The Part with this identifier, or none when there is no such Part.
  abstract readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>>;
}
