import { ApiPropertyOptional } from '@nestjs/swagger';
import { PagingRequest, Role } from '@pcp/core';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { Category } from '~/domain/part/Category';
import { SearchPartsQueryInput } from '~/domain/part/SearchPartsQuery';

// A search of the catalog, from the address's query, with the page asked for
// and the Vendor whose Offers the results name.
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

  @ApiPropertyOptional({
    description:
      "The Vendor whose Offer for each Part the results name. The Admin may name any Vendor, and a Vendor's own Login only its own. Left out, a Vendor's own Login gets its own Offers named, and the Admin no Vendor's.",
    example: '7c1e9a40-2b5d-4f8e-9a63-0d4b8e2f1c75',
  })
  @IsOptional()
  @IsString()
  readonly vendorId?: string;

  toQueryInput(callerId: string, callerRoles: readonly Role[]): SearchPartsQueryInput {
    return new SearchPartsQueryInput(
      callerId,
      callerRoles,
      this.search ?? '',
      this.category === undefined ? undefined : Category.withKey(this.category),
      this.vendorId,
      this.toDomain(),
    );
  }
}
