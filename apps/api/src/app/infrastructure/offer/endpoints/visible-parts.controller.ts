import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { ListVisiblePartsQuery } from '~/domain/offer/ListVisiblePartsQuery';
import { ReadVisiblePartsFiltersQuery } from '~/domain/offer/ReadVisiblePartsFiltersQuery';

import { ListVisiblePartsRequest } from './ListVisiblePartsRequest';
import { ReadVisiblePartsFiltersRequest } from './ReadVisiblePartsFiltersRequest';
import { VisiblePartPageResponse } from './VisiblePartPageResponse';
import { VisiblePartsFiltersResponse } from './VisiblePartsFiltersResponse';

// The Visible Parts, the only Parts Shoppers see, for anyone: the Shopper app
// has no Login. It answers the same with a good token, a bad one or none.
@Controller()
export class VisiblePartsController {
  constructor(
    private readonly listVisiblePartsQuery: ListVisiblePartsQuery,
    private readonly readVisiblePartsFiltersQuery: ReadVisiblePartsFiltersQuery,
  ) {}

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

  // Matched before a Visible Part's own address, `v1/visible-parts/:partId`,
  // since `OfferModule` lists this controller before that one's, so that
  // `filters` is never read as a Part's identifier.
  @ApiOperation({
    summary:
      "A Category's filters: its Visible Parts' manufacturers, each of its filters with the values they hold, and the range of their Lowest Prices in the chosen currency, read before any filter or search is applied",
    security: [],
  })
  @ApiOkResponse({ type: VisiblePartsFiltersResponse })
  @Public()
  @Get('v1/visible-parts/filters')
  async readVisiblePartsFilters(
    @Query() request: ReadVisiblePartsFiltersRequest,
  ): Promise<VisiblePartsFiltersResponse> {
    const result = await this.readVisiblePartsFiltersQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) => VisiblePartsFiltersResponse.of(output.getFilters())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
