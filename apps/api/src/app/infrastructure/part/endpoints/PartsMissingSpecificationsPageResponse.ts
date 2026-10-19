import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { PartsMissingSpecificationsPage } from '~/domain/part/PartStore';

import { PartMissingSpecificationsResponse } from './PartMissingSpecificationsResponse';

// One page of the Parts that have an Offer and lack a needed specification.
export class PartsMissingSpecificationsPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Parts, by Category in the order of the eight, then by their count of Offers, most first, then by name.",
    type: [PartMissingSpecificationsResponse],
  })
  readonly content: PartMissingSpecificationsResponse[];

  private constructor(page: PartsMissingSpecificationsPage) {
    super(page.getPageAttributes());
    this.content = page.getParts().map(PartMissingSpecificationsResponse.of);
  }

  static of(page: PartsMissingSpecificationsPage): PartsMissingSpecificationsPageResponse {
    return new PartsMissingSpecificationsPageResponse(page);
  }
}
