import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { PartRequestsPage } from '~/domain/part-request/PartRequestStore';

import { PartRequestWithVendorResponse } from './PartRequestWithVendorResponse';

// One page of the Admin's queue of open Part Requests.
export class OpenPartRequestsPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's open Part Requests, of every Vendor, active and deactivated, each with its Vendor: oldest first, then by identifier.",
    type: [PartRequestWithVendorResponse],
  })
  readonly content: PartRequestWithVendorResponse[];

  private constructor(page: PartRequestsPage, readAt: Date) {
    super(page.getPageAttributes());
    this.content = page
      .getPartRequests()
      .map((answered) => PartRequestWithVendorResponse.of(answered, readAt));
  }

  static of(page: PartRequestsPage, readAt: Date): OpenPartRequestsPageResponse {
    return new OpenPartRequestsPageResponse(page, readAt);
  }
}
