import { ApiPropertyOptional } from '@nestjs/swagger';
import { PagingRequest } from '@pcp/core';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { Category } from '~/domain/part/Category';
import { SearchPartsQueryInput } from '~/domain/part/SearchPartsQuery';

// A search of the catalog, from the address's query, with the page asked for.
export class SearchPartsRequest extends PagingRequest {
  @ApiPropertyOptional({
    description:
      'Words a Part must hold, in any order and any case, in its name, its manufacturer or a part number. Left out or empty, every Part is found.',
    example: 'ryzen 7600',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'The one Category to search in.',
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsOptional()
  @IsIn(Category.keys())
  readonly category?: string;

  toQueryInput(): SearchPartsQueryInput {
    return new SearchPartsQueryInput(
      this.search ?? '',
      this.category === undefined ? undefined : Category.withKey(this.category),
      this.toPageable(),
    );
  }
}
