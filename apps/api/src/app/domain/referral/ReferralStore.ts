import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

// A Referral to record: the Vendor, the Shared Build it was sent from, and
// the moment of the tap. Nothing about the Shopper.
export class RecordReferralParams {
  constructor(
    private readonly vendorId: string,
    private readonly sharedBuildId: string,
    private readonly referredAt: Date,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  getSharedBuildId(): string {
    return this.sharedBuildId;
  }

  getReferredAt(): Date {
    return this.referredAt;
  }
}

// A Vendor with its Referral count: how many Referrals name it, over all
// time, whether it is active or a deactivated Vendor.
export class VendorsReferralCount {
  constructor(
    private readonly vendorId: string,
    private readonly name: string,
    private readonly active: boolean,
    private readonly count: number,
  ) {}

  getVendorId(): string {
    return this.vendorId;
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  isActive(): boolean {
    return this.active;
  }

  getCount(): number {
    return this.count;
  }
}

// One page of every Vendor's Referral count, and where the page stands among
// them all.
export class ReferralCountsPage {
  constructor(
    private readonly counts: readonly VendorsReferralCount[],
    private readonly page: PageAttributes,
  ) {}

  getCounts(): readonly VendorsReferralCount[] {
    return this.counts;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// Where Referrals are kept. It is the port: the domain says what it needs,
// and infrastructure provides it. A Referral is only ever added.
export abstract class ReferralStore {
  // Stores one Referral. Each call is one, however many name the same Vendor
  // and Shared Build.
  abstract record(
    params: RecordReferralParams,
  ): Promise<Either.Either<void, StructuredError>>;

  // Every Vendor, active and deactivated, with its Referral count, zeros
  // included: the most Referrals first, then by name, then by identifier, so
  // that moving between pages never skips or repeats one. The page and the
  // total are read at one moment.
  abstract listCounts(
    pageable: PageableAttributes,
  ): Promise<Either.Either<ReferralCountsPage, StructuredError>>;

  // How many Referrals name the Vendor with this identifier, over all time.
  abstract countFor(vendorId: string): Promise<Either.Either<number, StructuredError>>;
}
