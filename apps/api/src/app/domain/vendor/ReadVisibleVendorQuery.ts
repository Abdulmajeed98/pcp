import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Vendor } from './Vendor';
import { vendorNotFound } from './vendor-errors';
import { VendorStore } from './VendorStore';

class Input {
  constructor(private readonly vendorId: string) {}

  getVendorId(): string {
    return this.vendorId;
  }
}

class Output {
  private constructor(private readonly vendor: Vendor) {}

  static of(vendor: Vendor): Output {
    return new Output(vendor);
  }

  // An active Vendor, of which Shoppers see only its name, its city and its
  // contact details.
  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as ReadVisibleVendorQueryInput };
export { Output as ReadVisibleVendorQueryOutput };

// One active Vendor, for anyone, with no Login, as a Vendor page shows it
// (BRW-4), also when it has no Visible Offer, so that its page still says how
// to reach it. A deactivated Vendor is answered as one that does not exist,
// whoever asks, so that no Shopper contacts a shop that has left the platform
// (ACC-7).
@Injectable()
export class ReadVisibleVendorQuery {
  constructor(private readonly vendorStore: VendorStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const found = await this.vendorStore.readById(vendorId);

    return Either.flatMap(found, (vendor) =>
      Option.isSome(vendor) && vendor.value.isActive()
        ? Either.right(Output.of(vendor.value))
        : Either.left(vendorNotFound(vendorId)),
    );
  }
}
