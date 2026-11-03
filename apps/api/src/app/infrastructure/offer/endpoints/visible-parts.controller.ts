import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { ListVisiblePartsQuery } from '~/domain/offer/ListVisiblePartsQuery';

import { ListVisiblePartsRequest } from './ListVisiblePartsRequest';
import { VisiblePartPageResponse } from './VisiblePartPageResponse';

// The Visible Parts, the only Parts Shoppers see, for anyone: the Shopper app
// has no Login. It answers the same with a good token, a bad one or none.
@Controller()
export class VisiblePartsController {
  constructor(private readonly listVisiblePartsQuery: ListVisiblePartsQuery) {}

  @ApiOperation({
    summary:
      "One page of a Category's Visible Parts, the Parts with at least one Visible Offer, each with its Lowest Price in the chosen currency, how many Vendors offer it and whether one has it in stock, the lowest Lowest Price first and the Parts every Vendor has out of stock last",
    security: [],
  })
  @ApiOkResponse({ type: VisiblePartPageResponse })
  @Public()
  @Get('v1/visible-parts')
  async listVisibleParts(
    @Query() request: ListVisiblePartsRequest,
  ): Promise<VisiblePartPageResponse> {
    const result = await this.listVisiblePartsQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) => VisiblePartPageResponse.of(output.getPage())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
