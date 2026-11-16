import { ApiProperty } from '@nestjs/swagger';

import { ReadVendorsReferralCountQueryOutput } from '~/domain/referral/ReadVendorsReferralCountQuery';

// One Vendor's Referral count.
export class ReferralCountResponse {
  @ApiProperty({
    description: 'How many Referrals name the Vendor, over all time.',
    example: 12,
  })
  readonly count: number;

  private constructor(output: ReadVendorsReferralCountQueryOutput) {
    this.count = output.getCount();
  }

  static of(output: ReadVendorsReferralCountQueryOutput): ReferralCountResponse {
    return new ReferralCountResponse(output);
  }
}
