import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Vendor } from './Vendor';
import { VendorAccessRule } from './VendorAccessRule';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
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

export { Input as ReadVendorQueryInput };
export { Output as ReadVendorQueryOutput };

// One Vendor, by its identifier, for the Admin or for the Vendor's own Login,
// by the rule for which Vendor a request acts for.
@Injectable()
export class ReadVendorQuery {
  constructor(private readonly vendorAccessRule: VendorAccessRule) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );

    return Either.map(vendor, Output.of);
  }
}
