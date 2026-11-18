import { OfferDetails } from '../offer/OfferDetails';
import { HoldsPartNumbers } from './offer-sheet-part-numbers';

// A Part as an Offer sheet's row needs it: its name, in English as the
// catalog holds it (LANG-3), and its part numbers, in the catalog's order.
export class PartOnTheSheet implements HoldsPartNumbers {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly partNumbers: readonly string[],
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPartNumbers(): readonly string[] {
    return this.partNumbers;
  }
}

// One of the Vendor's Offers, as its row of the Offer sheet is written from
// it: its Part and its details.
export class OfferOnTheSheet {
  constructor(
    private readonly offerId: string,
    private readonly part: PartOnTheSheet,
    private readonly details: OfferDetails,
  ) {}

  getOfferId(): string {
    return this.offerId;
  }

  getPart(): PartOnTheSheet {
    return this.part;
  }

  getDetails(): OfferDetails {
    return this.details;
  }
}

// A Part of the catalog as far as its part numbers go, as the download
// reads the Parts that hold its rows' numbers.
export class PartNumbersOfAPart implements HoldsPartNumbers {
  constructor(
    private readonly id: string,
    private readonly partNumbers: readonly string[],
  ) {}

  getId(): string {
    return this.id;
  }

  getPartNumbers(): readonly string[] {
    return this.partNumbers;
  }
}
