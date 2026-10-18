import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { VendorsPage } from '~/domain/vendor/VendorStore';

import { VendorSummaryResponse } from './VendorSummaryResponse';

// One page of the Vendors.
export class VendorPageResponse extends PagingResponse {
  @ApiProperty({
    description: "The page's Vendors, in name order.",
    type: [VendorSummaryResponse],
  })
  readonly content: VendorSummaryResponse[];

  private constructor(page: VendorsPage) {
    super(page.getPageAttributes());
    this.content = page.getVendors().map(VendorSummaryResponse.of);
  }

  static of(page: VendorsPage): VendorPageResponse {
    return new VendorPageResponse(page);
  }
}
