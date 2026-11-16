import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { ReferralStore } from './ReferralStore';

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
  private constructor(private readonly count: number) {}

  static of(count: number): Output {
    return new Output(count);
  }

  // How many Referrals name the Vendor, over all time.
  getCount(): number {
    return this.count;
  }
}

export { Input as ReadVendorsReferralCountQueryInput };
export { Output as ReadVendorsReferralCountQueryOutput };

// A Vendor reads its own Referral count in its portal, or the Admin reads any
// Vendor's, acting as it or not, by the rule for which Vendor a request acts
// for (SHR-7). No other Vendor and no Shopper reads it.
@Injectable()
export class ReadVendorsReferralCountQuery {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly referralStore: ReferralStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    const count = await this.referralStore.countFor(actedFor.right.getId());

    return Either.map(count, Output.of);
  }
}
