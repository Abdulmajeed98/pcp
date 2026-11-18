import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { PartRequestsPage } from '~/domain/part-request/PartRequestStore';

import { PartRequestResponse } from './PartRequestResponse';

// One page of a Vendor's Part Requests.
export class VendorsPartRequestsPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Part Requests, in every state: newest first, then by identifier.",
    type: [PartRequestResponse],
  })
  readonly content: PartRequestResponse[];

  private constructor(page: PartRequestsPage, readAt: Date) {
    super(page.getPageAttributes());
    this.content = page
      .getPartRequests()
      .map((answered) => PartRequestResponse.of(answered, readAt));
  }

  static of(page: PartRequestsPage, readAt: Date): VendorsPartRequestsPageResponse {
    return new VendorsPartRequestsPageResponse(page, readAt);
  }
}
