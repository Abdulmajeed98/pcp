import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

import { PageableAttributes } from '../../domain/paging/PageableAttributes';

// The page a caller asks for, from the address's query: `page`, counted from
// 0, and `size`. A Request of an endpoint that answers in pages extends it.
export class PagingRequest {
  static readonly DEFAULT_SIZE = 20;
  static readonly LARGEST_SIZE = 100;

  @ApiPropertyOptional({ description: 'The page, counted from 0.', default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
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

  toPageable(): PageableAttributes {
    return new PageableAttributes(this.page, this.size);
  }
}
