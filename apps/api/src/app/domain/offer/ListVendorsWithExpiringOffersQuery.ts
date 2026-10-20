import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import {
  ListVendorsWithExpiringOffersParams,
  OfferStore,
  VendorsWithExpiringOffersPage,
} from './OfferStore';

class Input {
  constructor(private readonly pageable: PageableAttributes) {}

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: VendorsWithExpiringOffersPage) {}

  static of(page: VendorsWithExpiringOffersPage): Output {
    return new Output(page);
  }

  getVendorsPage(): VendorsWithExpiringOffersPage {
    return this.page;
  }
}

export { Input as ListVendorsWithExpiringOffersQueryInput };
export { Output as ListVendorsWithExpiringOffersQueryOutput };

// The Admin lists the active Vendors that have Expired Offers or Offers about
// to expire, a page at a time, most urgent first, so that the Admin can remind
// them personally (OFF-9). The platform sends nothing itself. Deactivated
// Vendors are left out: they have left, and their Offers are not visible
// anyway.
@Injectable()
export class ListVendorsWithExpiringOffersQuery {
  constructor(private readonly offerStore: OfferStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Vendor on the page is judged at the same
    // moment.
    const page = await this.offerStore.listVendorsWithExpiringOffers(
      new ListVendorsWithExpiringOffersParams(input.getPageable(), new Date()),
    );

    return Either.map(page, Output.of);
  }
}
