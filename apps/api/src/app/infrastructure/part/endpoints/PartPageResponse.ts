import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { PartsPage } from '~/domain/part/PartStore';

import { FoundPartResponse } from './FoundPartResponse';

// One page of the Parts a search found.
export class PartPageResponse extends PagingResponse {
  @ApiProperty({
    description: "The page's Parts, in name order.",
    type: [FoundPartResponse],
  })
  readonly content: FoundPartResponse[];

  private constructor(page: PartsPage) {
    super(page.getPageAttributes());
    this.content = page
      .getParts()
      .map((part) => FoundPartResponse.withOffer(part, page.getOfferIdOf(part)));
  }

  static of(page: PartsPage): PartPageResponse {
    return new PartPageResponse(page);
  }
}
