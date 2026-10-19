import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Offer } from './Offer';
import { OfferDetails } from './OfferDetails';

// A new Offer: the Vendor and the Part, its details, the time of its first
// Confirmation, and the Caller who adds it, whom its history records.
export class CreateOfferParams {
  constructor(
    private readonly vendorId: string,
    private readonly partId: string,
    private readonly details: OfferDetails,
    private readonly confirmedAt: Date,
    private readonly callerId: string,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getPartId(): string {
    return this.partId;
  }

  getDetails(): OfferDetails {
    return this.details;
  }

  getConfirmedAt(): Date {
    return this.confirmedAt;
  }

  // The identifier of the Login the request was made with: the Vendor's own,
  // or the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// Where Offers and their history are kept. It is the port: the domain says
// what it needs, and infrastructure provides it.
export abstract class OfferStore {
  // Stores a new Offer, confirmed and created at the time given, and adds the
  // first row of its history, with the same time and the Caller, in the same
  // transaction (OFF-10). A second Offer for the same Vendor and Part is
  // refused as taken, `NOT_VALID` on `partId`, also when two requests to add
  // one arrive at once (OFF-1).
  abstract create(
    params: CreateOfferParams,
  ): Promise<Either.Either<Offer, StructuredError>>;

  // The Vendor's Offer with this identifier, or none when there is no such
  // Offer or it is another Vendor's.
  abstract readById(
    vendorId: string,
    offerId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>>;

  // The Vendor's Offer for this Part, or none, so that adding an Offer, and
  // later the sheet and Part Requests, find the one a Vendor already has.
  abstract readByPart(
    vendorId: string,
    partId: string,
  ): Promise<Either.Either<Option.Option<Offer>, StructuredError>>;
}
