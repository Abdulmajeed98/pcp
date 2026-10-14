import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

import { PageableAttributes } from '../../domain/paging/PageableAttributes';

// The page a caller asks for, from the address's query: `page`, counted from
// 0, and `size`. A Request of an endpoint that answers in pages extends it.
// The largest page number keeps the number of items passed over within what
// the database takes, so that a page far past the end is answered as empty
// and never refused by the database.
export class PagingRequest {
  static readonly DEFAULT_SIZE = 10;
  static readonly LARGEST_SIZE = 100;
  static readonly LARGEST_PAGE = 1_000_000;

  @ApiPropertyOptional({
    description: 'The page, counted from 0.',
    default: 0,
    minimum: 0,
    maximum: PagingRequest.LARGEST_PAGE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PagingRequest.LARGEST_PAGE)
  readonly page: number = 0;

  @ApiPropertyOptional({
    description: 'How many items a page holds.',
    default: PagingRequest.DEFAULT_SIZE,
    minimum: 1,
    maximum: PagingRequest.LARGEST_SIZE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PagingRequest.LARGEST_SIZE)
  readonly size: number = PagingRequest.DEFAULT_SIZE;

  toDomain(): PageableAttributes {
    return new PageableAttributes(this.page, this.size);
  }
}
