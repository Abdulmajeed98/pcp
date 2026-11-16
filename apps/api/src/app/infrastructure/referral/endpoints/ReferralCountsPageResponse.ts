import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { ListReferralCountsQueryOutput } from '~/domain/referral/ListReferralCountsQuery';
import { VendorsReferralCount } from '~/domain/referral/ReferralStore';

// A Vendor with its Referral count, as the Admin's list answers it.
export class VendorsReferralCountResponse {
  @ApiProperty({
    description: "The Vendor's identifier on the platform.",
    example: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Vendor's name, as the Vendor writes it.",
    example: 'Made-up Computer Shop',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Whether the Vendor is active, or a deactivated Vendor.',
    example: true,
  })
  readonly active: boolean;

  @ApiProperty({
    description: 'How many Referrals name the Vendor, over all time.',
    example: 12,
  })
  readonly count: number;

  private constructor(count: VendorsReferralCount) {
    this.id = count.getVendorId();
    this.name = count.getName();
    this.active = count.isActive();
    this.count = count.getCount();
  }

  static of(count: VendorsReferralCount): VendorsReferralCountResponse {
    return new VendorsReferralCountResponse(count);
  }
}

// One page of every Vendor's Referral count.
export class ReferralCountsPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Vendors, active and deactivated, those with none among them: the most Referrals first, then by name, then by identifier.",
    type: [VendorsReferralCountResponse],
  })
  readonly content: VendorsReferralCountResponse[];

  private constructor(output: ListReferralCountsQueryOutput) {
    const page = output.getCountsPage();
    super(page.getPageAttributes());
    this.content = page.getCounts().map(VendorsReferralCountResponse.of);
  }

  static of(output: ListReferralCountsQueryOutput): ReferralCountsPageResponse {
    return new ReferralCountsPageResponse(output);
  }
}
