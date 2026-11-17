import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { PhoneNumber } from '../phone-number/PhoneNumber';
import { existingSharedBuild } from '../shared-build/existing-shared-build';
import { SharedBuildStore } from '../shared-build/SharedBuildStore';
import { existingVendor } from '../vendor/existing-vendor';
import { vendorNotFound } from '../vendor/vendor-errors';
import { VendorStore } from '../vendor/VendorStore';
import { noWhatsAppNumberRefused } from './referral-errors';
import { RecordReferralParams, ReferralStore } from './ReferralStore';

class Input {
  constructor(
    private readonly sharedBuildId: string,
    private readonly vendorId: string,
  ) {}

  // The Shared Build the Referral is sent from.
  getSharedBuildId(): string {
    return this.sharedBuildId;
  }

  // The Vendor it is sent to.
  getVendorId(): string {
    return this.vendorId;
  }
}

class Output {
  private constructor(
    private readonly vendorId: string,
    private readonly name: string,
    private readonly whatsAppNumber: PhoneNumber,
    private readonly referredAt: Date,
  ) {}

  static of(
    vendorId: string,
    name: string,
    whatsAppNumber: PhoneNumber,
    referredAt: Date,
  ): Output {
    return new Output(vendorId, name, whatsAppNumber, referredAt);
  }

  getVendorId(): string {
    return this.vendorId;
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  // The number the Shopper's chat with the Vendor is opened with.
  getWhatsAppNumber(): PhoneNumber {
    return this.whatsAppNumber;
  }

  // The moment of the tap, by the API's clock.
  getReferredAt(): Date {
    return this.referredAt;
  }
}

export { Input as RecordReferralCommandInput };
export { Output as RecordReferralCommandOutput };

// Anyone, with no Login, records a Referral: one tap on "send on WhatsApp"
// sends a Shared Build to a Vendor (SHR-6). It is recorded for an active
// Vendor that gave a WhatsApp number, with the Shared Build and now by the
// API's clock, and answers the Vendor's number, so that the Shopper app opens
// the chat with it. Whether the Vendor stocks a Part of the Shared Build is
// not asked: its stock may have changed since the page was drawn. Each call
// is one Referral, and a refused one is not recorded. Nothing about the
// Shopper is recorded.
@Injectable()
export class RecordReferralCommand {
  constructor(
    private readonly sharedBuildStore: SharedBuildStore,
    private readonly vendorStore: VendorStore,
    private readonly referralStore: ReferralStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const sharedBuildId = input.getSharedBuildId();
    const sharedBuild = existingSharedBuild(
      sharedBuildId,
      await this.sharedBuildStore.readById(sharedBuildId),
    );
    if (Either.isLeft(sharedBuild)) return Either.left(sharedBuild.left);

    const vendorId = input.getVendorId();
    const vendor = existingVendor(vendorId, await this.vendorStore.readById(vendorId));
    if (Either.isLeft(vendor)) return Either.left(vendor.left);
    // A deactivated Vendor is hidden from Shoppers (ACC-7), so it is answered
    // as one that does not exist.
    if (!vendor.right.isActive()) return Either.left(vendorNotFound(vendorId));
    const whatsAppNumber = vendor.right.getContactDetails().getWhatsAppNumber();
    if (whatsAppNumber === null) return Either.left(noWhatsAppNumberRefused());

    const referredAt = new Date();
    const recorded = await this.referralStore.record(
      new RecordReferralParams(vendor.right.getId(), sharedBuild.right.getId(), referredAt),
    );

    return Either.map(recorded, () =>
      Output.of(vendor.right.getId(), vendor.right.getName(), whatsAppNumber, referredAt),
    );
  }
}
