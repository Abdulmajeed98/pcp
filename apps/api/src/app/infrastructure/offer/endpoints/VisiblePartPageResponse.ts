import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({
    description:
      'With a Build, how many of the Parts the list judged are Compatible with it, on all the pages together: those that the search, the manufacturers, the filters, the price range and in stock only keep, read in the same statement as the page. Left out when the list was asked for without a Build.',
    type: 'integer',
    example: 4,
  })
  readonly compatibleCount?: number;

  @ApiPropertyOptional({
    description:
      'With a Build, how many of the Parts the list judged are not Compatible with it, on all the pages together, whether or not the switch keeps them, read in the same statement as the page. Left out when the list was asked for without a Build.',
    type: 'integer',
    example: 3,
  })
  readonly notCompatibleCount?: number;

  private constructor(page: VisiblePartsPage) {
    super(page.getPageAttributes());
    this.content = page.getParts().map(VisiblePartResponse.ofVisible);
    const counted = page.getCompatibleCount();
    this.compatibleCount = counted?.getCompatible();
    this.notCompatibleCount = counted?.getNotCompatible();
  }

  static of(page: VisiblePartsPage): VisiblePartPageResponse {
    return new VisiblePartPageResponse(page);
  }
}
