import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { OfferDetails, UncheckedOfferDetails } from '../offer/OfferDetails';
import { Category } from '../part/Category';
import { cleanPartNumber } from '../part/part-numbers';
import { holdsText, lengthOf } from '../vendor/detail-text';
import { partRequestDetailRefused } from './part-request-errors';

// The longest name and part number a Part Request may give, in characters
// as `lengthOf` counts them.
export const longestPartRequestName = 300;
export const longestPartRequestPartNumber = 100;

// The details of a Part Request as they were sent, before they are checked.
// A detail that was not given is null.
export class UncheckedPartRequestDetails {
  constructor(
    private readonly categoryKey: string | null,
    private readonly name: string | null,
    private readonly partNumber: string | null,
    private readonly offerDetails: UncheckedOfferDetails,
  ) {}

  // The key of the Category it names.
  getCategoryKey(): string | null {
    return this.categoryKey;
  }

  getName(): string | null {
    return this.name;
  }

  getPartNumber(): string | null {
    return this.partNumber;
  }

  getOfferDetails(): UncheckedOfferDetails {
    return this.offerDetails;
  }
}

// The details of a Part Request as they will be kept: the Part's Category,
// its name as the Vendor wrote it, its manufacturer part number as the
// catalog cleans one, and the Offer the Vendor would make (REQ-1). No
// manufacturer and no specification: those are the Admin's to give (CAT-4).
export class PartRequestDetails {
  private constructor(
    private readonly category: Category,
    private readonly name: string,
    private readonly partNumber: string,
    private readonly offerDetails: OfferDetails,
  ) {}

  // The details as they will be kept, or the refusal of the first that does
  // not fit, in the form's order: the Category, the name, the part number,
  // then the Offer's details, checked as an Offer's are.
  static check(
    typed: UncheckedPartRequestDetails,
  ): Either.Either<PartRequestDetails, NotValidError> {
    const categoryKey = typed.getCategoryKey();
    if (!holdsText(categoryKey)) {
      return Either.left(partRequestDetailRefused('category', 'missing'));
    }
    const category = Category.withKey(categoryKey);
    if (category === undefined) {
      return Either.left(partRequestDetailRefused('category', 'notInTheSet'));
    }

    const name = typed.getName();
    if (!holdsText(name)) return Either.left(partRequestDetailRefused('name', 'missing'));
    if (lengthOf(name) > longestPartRequestName) {
      return Either.left(partRequestDetailRefused('name', 'tooLong'));
    }

    const typedPartNumber = typed.getPartNumber();
    const partNumber = typedPartNumber === null ? '' : cleanPartNumber(typedPartNumber);
    if (partNumber === '') {
      return Either.left(partRequestDetailRefused('partNumber', 'missing'));
    }
    if (lengthOf(partNumber) > longestPartRequestPartNumber) {
      return Either.left(partRequestDetailRefused('partNumber', 'tooLong'));
    }

    return Either.map(
      OfferDetails.check(typed.getOfferDetails()),
      (offerDetails) => new PartRequestDetails(category, name, partNumber, offerDetails),
    );
  }

  getCategory(): Category {
    return this.category;
  }

  // As the Vendor wrote it.
  getName(): string {
    return this.name;
  }

  // Without invisible marks and without the space around it, as the catalog
  // keeps a part number.
  getPartNumber(): string {
    return this.partNumber;
  }

  // The Offer the Vendor would make: its Quoted Prices, whether it is in
  // stock, and its warranty.
  getOfferDetails(): OfferDetails {
    return this.offerDetails;
  }
}
