import { ApiProperty } from '@nestjs/swagger';
import { PageResponse } from '@pcp/core';

import { PartsPage } from '~/domain/part/PartStore';

import { PartSummaryResponse } from './PartSummaryResponse';

// One page of the Parts a search found.
export class PartPageResponse extends PageResponse {
  @ApiProperty({
    description: "The page's Parts, in name order.",
    type: [PartSummaryResponse],
  })
  readonly content: PartSummaryResponse[];

  private constructor(page: PartsPage) {
    super(page.getPage());
    this.content = page.getParts().map(PartSummaryResponse.of);
  }

  static of(page: PartsPage): PartPageResponse {
    return new PartPageResponse(page);
  }
}
