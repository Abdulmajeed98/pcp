import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Currency } from '../currency/currency';
import { vendorNotFound } from '../vendor/vendor-errors';
import { OfferStore } from './OfferStore';
import { VisibleOffersOfVendorPage } from './VisibleOffersOfVendorPage';

class Input {
  constructor(
    private readonly vendorId: string,
    private readonly currency: Currency,
    private readonly pageable: PageableAttributes,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  // The chosen currency, which every Shown Price is in and the Offers of each
  // Category are ordered by.
  getCurrency(): Currency {
    return this.currency;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(
    private readonly page: VisibleOffersOfVendorPage,
    private readonly now: Date,
  ) {}

  static of(page: VisibleOffersOfVendorPage, now: Date): Output {
    return new Output(page, now);
  }

  getPage(): VisibleOffersOfVendorPage {
    return this.page;
  }

  // The moment the Offers were read at, by the API's clock, which their
  // visibility was judged by and their days since Confirmation are counted
  // from.
  getNow(): Date {
    return this.now;
  }
}

export { Input as ListVisibleOffersOfVendorQueryInput };
export { Output as ListVisibleOffersOfVendorQueryOutput };

// One page of an active Vendor's visible Offers, for anyone, with no Login,
// as a Vendor page lists them (BRW-4): those that are not Expired Offers, by
// the rule in `visibility.ts` (CAT-7, OFF-6), each with its Part and its
// Shown Price in the chosen currency (PRC-3), grouped by Category in the
// catalog's order, and within each in stock first and then the lowest Shown
// Price (OFF-11, PRC-4). A deactivated Vendor is answered as one that does
// not exist, whoever asks (ACC-7).
@Injectable()
export class ListVisibleOffersOfVendorQuery {
  constructor(private readonly offerStore: OfferStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    // Read once, so that which Offers are visible and how many days ago each
    // was confirmed are judged at the same moment.
    const now = new Date();
    const found = await this.offerStore.listVisibleByVendor(
      vendorId,
      input.getCurrency(),
      input.getPageable(),
      now,
    );

    return Either.flatMap(found, (page) =>
      Option.match(page, {
        onNone: () => Either.left(vendorNotFound(vendorId)),
        onSome: (visible) => Either.right(Output.of(visible, now)),
      }),
    );
  }
}
