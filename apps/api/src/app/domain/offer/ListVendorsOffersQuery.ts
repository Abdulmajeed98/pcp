import { Injectable } from '@nestjs/common';
import { PageableAttributes, Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { searchWordsOf } from '../part/search-words';
import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { ListVendorsOffersParams, OfferStore, VendorsOffersPage } from './OfferStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly term: string,
    private readonly pageable: PageableAttributes,
  ) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }

  getCallerRoles(): readonly Role[] {
    return this.callerRoles;
  }

  getVendorId(): string {
    return this.vendorId;
  }

  getTerm(): string {
    return this.term;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(
    private readonly page: VendorsOffersPage,
    private readonly now: Date,
  ) {}

  static of(page: VendorsOffersPage, now: Date): Output {
    return new Output(page, now);
  }

  getOffersPage(): VendorsOffersPage {
    return this.page;
  }

  // The moment the list was read at, by the API's clock, which each Offer's
  // expiry is judged by, as the counts were.
  getNow(): Date {
    return this.now;
  }
}

export { Input as ListVendorsOffersQueryInput };
export { Output as ListVendorsOffersQueryOutput };

// A Vendor's own Offers, Expired Offers among them, a page at a time, for the
// Admin or for the Vendor's own Login, by the rule for which Vendor a request
// acts for. They are searched by their Parts' name, manufacturer and part
// numbers, as the catalog search reads them, and ordered by last
// Confirmation, oldest first, so that the Offers that need attention come
// first.
@Injectable()
export class ListVendorsOffersQuery {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly offerStore: OfferStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    // Read once, so that the list, its counts and each Offer's expiry are
    // judged at the same moment.
    const now = new Date();
    const page = await this.offerStore.listByVendor(
      new ListVendorsOffersParams(
        actedFor.right.getId(),
        searchWordsOf(input.getTerm()),
        input.getPageable(),
        now,
      ),
    );

    return Either.map(page, (found) => Output.of(found, now));
  }
}
