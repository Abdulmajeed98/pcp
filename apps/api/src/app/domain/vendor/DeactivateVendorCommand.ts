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

  // The Vendor as it now is: a deactivated Vendor.
  getVendor(): Vendor {
    return this.vendor;
  }
}

export { Input as DeactivateVendorCommandInput };
export { Output as DeactivateVendorCommandOutput };

// The Admin deactivates a Vendor (ACC-7). The Vendor is marked first, so that
// the API refuses its Login at once, and then the Login is disabled and its
// sessions are ended, so that it cannot log in again (ADR-0009). Each step is
// made whether or not it was made before, so a deactivation that failed
// halfway is finished by doing it again, and one already done changes
// nothing and is not refused. What was done before a step failed is kept.
@Injectable()
export class DeactivateVendorCommand {
  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const found = await this.vendorStore.readById(vendorId);
    if (Either.isLeft(found)) return Either.left(found.left);
    if (Option.isNone(found.right)) return Either.left(vendorNotFound(vendorId));

    let vendor = found.right.value;
    if (vendor.isActive()) {
      const marked = await this.vendorStore.markDeactivated(vendorId);
      if (Either.isLeft(marked)) return Either.left(marked.left);
      if (Option.isNone(marked.right)) return Either.left(vendorNotFound(vendorId));
      vendor = marked.right.value;
    }

    const disabled = await this.loginStore.disable(vendor.getLoginId());
    if (Either.isLeft(disabled)) return Either.left(disabled.left);

    const ended = await this.loginStore.endSessions(vendor.getLoginId());
    if (Either.isLeft(ended)) return Either.left(ended.left);

    return Either.right(Output.of(vendor));
  }
}
