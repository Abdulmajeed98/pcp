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

  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as ReadVendorQueryInput };
export { Output as ReadVendorQueryOutput };

// One Vendor, by its identifier.
@Injectable()
export class ReadVendorQuery {
  constructor(private readonly vendorStore: VendorStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const found = await this.vendorStore.readById(input.getVendorId());

    return Either.flatMap(found, (vendor) =>
      Option.match(vendor, {
        onNone: () => Either.left(vendorNotFound(input.getVendorId())),
        onSome: (existing) => Either.right(Output.of(existing)),
      }),
    );
  }
}
