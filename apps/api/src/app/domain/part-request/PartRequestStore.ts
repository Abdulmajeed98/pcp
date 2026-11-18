import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { OfferFulfilment } from './offer-fulfilment';
import { PartRequest, PartRequestAndOffer } from './PartRequest';
import { PartRequestDetails } from './PartRequestDetails';

// A Part Request to keep: the Vendor that sends it, its details, and the
// moment it is sent, by the API's clock.
export class SendPartRequestParams {
  constructor(
    private readonly vendorId: string,
    private readonly details: PartRequestDetails,
    private readonly sentAt: Date,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getDetails(): PartRequestDetails {
    return this.details;
  }

  getSentAt(): Date {
    return this.sentAt;
  }
}

// The fulfilment of a Part Request with a Part: the request, the Part, the
// moment it is resolved, by the API's clock, which the Offer it makes is
// made at, and the Caller, whom the Offer's history records.
export class FulfilPartRequestParams {
  constructor(
    private readonly partRequestId: string,
    private readonly partId: string,
    private readonly fulfilledAt: Date,
    private readonly callerId: string,
  ) {}

  getPartRequestId(): string {
    return this.partRequestId;
  }

  getPartId(): string {
    return this.partId;
  }

  getFulfilledAt(): Date {
    return this.fulfilledAt;
  }

  // The identifier of the Login the request was made with: the Admin's.
  getCallerId(): string {
    return this.callerId;
  }
}

// The rejection of a Part Request: the request, the Admin's reason, as the
// Admin wrote it, and the moment it is resolved, by the API's clock.
export class RejectPartRequestParams {
  constructor(
    private readonly partRequestId: string,
    private readonly reason: string,
    private readonly rejectedAt: Date,
  ) {}

  getPartRequestId(): string {
    return this.partRequestId;
  }

  getReason(): string {
    return this.reason;
  }

  getRejectedAt(): Date {
    return this.rejectedAt;
  }
}

// One page of Part Requests, each with the Vendor's Offer for its Part now
// when it was fulfilled, and where the page stands among them all.
export class PartRequestsPage {
  constructor(
    private readonly partRequests: readonly PartRequestAndOffer[],
    private readonly page: PageAttributes,
  ) {}

  getPartRequests(): readonly PartRequestAndOffer[] {
    return this.partRequests;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// Where Part Requests are kept. It is the port: the domain says what it
// needs, and infrastructure provides it. A Part Request is never deleted,
// and nothing changes it but its resolution, which happens once.
export abstract class PartRequestStore {
  // Keeps a new Part Request, open, and answers it.
  abstract send(
    params: SendPartRequestParams,
  ): Promise<Either.Either<PartRequest, StructuredError>>;

  // The Vendor's Part Requests in every state, newest first, then by
  // identifier, so that moving between pages never skips or repeats one,
  // with the page and the total read at one moment.
  abstract listByVendor(
    vendorId: string,
    pageable: PageableAttributes,
  ): Promise<Either.Either<PartRequestsPage, StructuredError>>;

  // The open Part Requests of every Vendor, active and deactivated, oldest
  // first, then by identifier, with the page and the total read at one
  // moment: the Admin's queue (REQ-2).
  abstract listOpen(
    pageable: PageableAttributes,
  ): Promise<Either.Either<PartRequestsPage, StructuredError>>;

  // The Part Request with this identifier, in any state, or none, also for
  // a text that is not an identifier, which the database is never asked.
  abstract readById(
    partRequestId: string,
  ): Promise<Either.Either<Option.Option<PartRequest>, StructuredError>>;

  // Fulfils the Part Request with the Part, in one transaction that holds
  // the request's row from the start: it is refused as resolved when it is
  // no longer open, so that it is resolved once however many calls arrive
  // at once; else the Vendor's Offer for the Part is made, replaced or kept
  // by the rule in `offer-fulfilment.ts`, through the Offer module's own
  // writing, and the request is marked fulfilled with the Part and the
  // moment. It answers what happened to the Offer.
  abstract fulfil(
    params: FulfilPartRequestParams,
  ): Promise<Either.Either<OfferFulfilment, StructuredError>>;

  // Rejects the Part Request with the reason, in one transaction that holds
  // its row, refused as resolved when it is no longer open, as a fulfilment
  // is.
  abstract reject(
    params: RejectPartRequestParams,
  ): Promise<Either.Either<void, StructuredError>>;
}
