import { ApiProperty } from '@nestjs/swagger';

import { PageAttributes } from '../../domain/paging/PageAttributes';

// Where a page stands in the whole list. The answer of an endpoint that
// answers in pages extends it with its `content`, the page's items.
export abstract class PagingResponse {
  @ApiProperty({ description: 'The page, counted from 0.', example: 0 })
  readonly pageNumber: number;

  @ApiProperty({ description: 'How many items a page holds.', example: 20 })
  readonly pageSize: number;

  @ApiProperty({
    description: 'How many items were found, on all the pages together.',
    example: 42,
  })
  readonly totalElements: number;

  @ApiProperty({ description: 'How many pages there are.', example: 3 })
  readonly totalPages: number;

  @ApiProperty({ description: 'Whether this is the first page.', example: true })
  readonly first: boolean;

  @ApiProperty({
    description: 'Whether this is the last page, or past it.',
    example: false,
  })
  readonly last: boolean;

  protected constructor(page: PageAttributes) {
    this.pageNumber = page.getPageNumber();
    this.pageSize = page.getPageSize();
    this.totalElements = page.getTotalElements();
    this.totalPages = page.getTotalPages();
    this.first = page.isFirst();
    this.last = page.isLast();
  }
}
