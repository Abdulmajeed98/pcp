import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { OfferStore } from './OfferStore';

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
  private constructor(private readonly confirmed: number) {}

  static of(confirmed: number): Output {
    return new Output(confirmed);
  }

  // How many Offers were confirmed: every Offer of the Vendor.
  getConfirmed(): number {
    return this.confirmed;
  }
}

export { Input as ConfirmAllOffersCommandInput };
export { Output as ConfirmAllOffersCommandOutput };

// A Vendor confirms all its Offers at once, its Expired Offers among them, so
// that keeping its prices current takes one tap when nothing changed (OFF-5),
// or the Admin confirms them for the Vendor, by the rule for which Vendor a
// request acts for. The time of the Confirmation is now by the API's clock. A
// Confirmation changes neither price nor stock, so it adds no history row.
@Injectable()
export class ConfirmAllOffersCommand {
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

    const confirmed = await this.offerStore.confirmAll(actedFor.right.getId(), new Date());

    return Either.map(confirmed, Output.of);
  }
}
