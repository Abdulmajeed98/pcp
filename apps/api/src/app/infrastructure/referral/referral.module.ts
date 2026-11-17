import { Module } from '@nestjs/common';

import { ListReferralCountsQuery } from '~/domain/referral/ListReferralCountsQuery';
import { ReadVendorsReferralCountQuery } from '~/domain/referral/ReadVendorsReferralCountQuery';
import { RecordReferralCommand } from '~/domain/referral/RecordReferralCommand';
import { ReferralStore } from '~/domain/referral/ReferralStore';
import { SharedBuildModule } from '~/infrastructure/shared-build/shared-build.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { ReferralController } from './endpoints/referral.controller';
import { SharedBuildReferralsController } from './endpoints/shared-build-referrals.controller';
import { DatabaseReferralStore } from './store/DatabaseReferralStore';

@Module({
  // A Referral names a Shared Build and a Vendor, and a Vendor's count is
  // read by the rule for which Vendor a request acts for.
  imports: [SharedBuildModule, VendorModule],
  // The public endpoint that records a Referral has a controller of its
  // own, apart from the counts the Admin and a Vendor read.
  controllers: [SharedBuildReferralsController, ReferralController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: ReferralStore, useClass: DatabaseReferralStore },
    RecordReferralCommand,
    ListReferralCountsQuery,
    ReadVendorsReferralCountQuery,
  ],
})
export class ReferralModule {}
