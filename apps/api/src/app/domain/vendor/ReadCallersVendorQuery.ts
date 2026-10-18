import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Vendor } from './Vendor';
import { VendorAccessRule } from './VendorAccessRule';
import { callersVendorNotFound } from './vendor-errors';

class Input {
  constructor(private readonly callerId: string) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }
}

class Output {
  private constructor(private readonly vendor: Vendor) {}

  static of(vendor: Vendor): Output {
    return new Output(vendor);
  }

  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as ReadCallersVendorQueryInput };
export { Output as ReadCallersVendorQueryOutput };

// The Vendor whose Login the Caller is, which the Vendor portal asks for when
// it starts. A Login with no Vendor behind it is answered as a Vendor that
// does not exist.
@Injectable()
export class ReadCallersVendorQuery {
  constructor(private readonly vendorAccessRule: VendorAccessRule) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const own = await this.vendorAccessRule.ownVendorOf(input.getCallerId());

    return Either.flatMap(own, (vendor) =>
      Either.map(
        Either.fromOption(vendor, () => callersVendorNotFound(input.getCallerId())),
        Output.of,
      ),
    );
  }
}
