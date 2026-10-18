import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { LoginStore } from '../login/LoginStore';
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

  // The Vendor as it now is: active.
  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as ReactivateVendorCommandInput };
export { Output as ReactivateVendorCommandOutput };

// The Admin reactivates a deactivated Vendor (ACC-7). Its Login is enabled
// first, and logs in again with the password it had, and the Vendor is
// marked active last, so that the API goes on refusing it until both are
// done (ADR-0009). The Login is enabled whether or not it was before, so a
// reactivation that failed halfway is finished by doing it again, and one
// already done changes nothing and is not refused.
@Injectable()
export class ReactivateVendorCommand {
  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const found = await this.vendorStore.readById(vendorId);
    if (Either.isLeft(found)) return Either.left(found.left);
    if (Option.isNone(found.right)) return Either.left(vendorNotFound(vendorId));

    const vendor = found.right.value;
    const enabled = await this.loginStore.enable(vendor.getLoginId());
    if (Either.isLeft(enabled)) return Either.left(enabled.left);
    if (vendor.isActive()) return Either.right(Output.of(vendor));

    const marked = await this.vendorStore.markActive(vendorId);
    return Either.flatMap(marked, (markedVendor) =>
      Option.match(markedVendor, {
        onNone: () => Either.left(vendorNotFound(vendorId)),
        onSome: (active) => Either.right(Output.of(active)),
      }),
    );
  }
}
