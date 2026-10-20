import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { ListVendorsWithExpiringOffersQueryOutput } from '~/domain/offer/ListVendorsWithExpiringOffersQuery';

import { VendorWithExpiringOffersResponse } from './VendorWithExpiringOffersResponse';

// One page of the Vendors to remind.
export class VendorsWithExpiringOffersPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Vendors: those with an Expired Offer first, by name; then those whose Offer expires soonest, then by name.",
    type: [VendorWithExpiringOffersResponse],
  })
  readonly content: VendorWithExpiringOffersResponse[];

  private constructor(output: ListVendorsWithExpiringOffersQueryOutput) {
    const page = output.getVendorsPage();
    super(page.getPageAttributes());
    this.content = page.getVendors().map(VendorWithExpiringOffersResponse.of);
  }

  static of(
    output: ListVendorsWithExpiringOffersQueryOutput,
  ): VendorsWithExpiringOffersPageResponse {
    return new VendorsWithExpiringOffersPageResponse(output);
  }
}
