import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { VisiblePartsPage } from '~/domain/offer/VisiblePartStore';

import { VisiblePartResponse } from './VisiblePartResponse';

// One page of a Category's Visible Parts.
export class VisiblePartPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Visible Parts: those with a Lowest Price first, the lowest first; then those in stock with none; then those every Vendor has out of stock; then by name.",
    type: [VisiblePartResponse],
  })
  readonly content: VisiblePartResponse[];

  private constructor(page: VisiblePartsPage) {
    super(page.getPageAttributes());
    this.content = page.getParts().map(VisiblePartResponse.ofVisible);
  }

  static of(page: VisiblePartsPage): VisiblePartPageResponse {
    return new VisiblePartPageResponse(page);
  }
}
