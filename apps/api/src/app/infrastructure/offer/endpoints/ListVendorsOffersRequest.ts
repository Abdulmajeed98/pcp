import { ApiPropertyOptional } from '@nestjs/swagger';
import { PagingRequest, Role } from '@pcp/core';
import { IsOptional, IsString } from 'class-validator';

import { ListVendorsOffersQueryInput } from '~/domain/offer/ListVendorsOffersQuery';

// A search of a Vendor's own Offers, from the address's query, with the page
// asked for.
export class ListVendorsOffersRequest extends PagingRequest {
  @ApiPropertyOptional({
    description:
      "Words an Offer's Part must hold, in any order and any case, in its name, its manufacturer or a part number, as the catalog search reads them. Left out or empty, every Offer of the Vendor is found.",
    example: 'ryzen 7600',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  toQueryInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): ListVendorsOffersQueryInput {
    return new ListVendorsOffersQueryInput(
      callerId,
      callerRoles,
      vendorId,
      this.search ?? '',
      this.toDomain(),
    );
  }
}
