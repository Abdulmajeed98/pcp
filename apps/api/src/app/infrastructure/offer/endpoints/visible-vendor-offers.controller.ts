import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { ListVisibleOffersOfVendorQuery } from '~/domain/offer/ListVisibleOffersOfVendorQuery';

import { ListVisibleOffersOfVendorRequest } from './ListVisibleOffersOfVendorRequest';
import { VisibleOfferOfVendorPageResponse } from './VisibleOfferOfVendorPageResponse';

// A visible Vendor's Offers, as a Vendor page lists them, for anyone: the
// Shopper app has no Login. It answers the same with a good token, a bad one
// or none.
@Controller()
export class VisibleVendorOffersController {
  constructor(
    private readonly listVisibleOffersOfVendorQuery: ListVisibleOffersOfVendorQuery,
  ) {}

  @ApiOperation({
    summary:
      "One page of an active Vendor's visible Offers: not Expired Offers, each with its Part, its Shown Price in the chosen currency and how many days ago it was confirmed, grouped by Category in the catalog's order, and within each in stock first and then the lowest Shown Price first; a deactivated Vendor is answered as one that does not exist",
    security: [],
  })
  @ApiOkResponse({ type: VisibleOfferOfVendorPageResponse })
  @Public()
  @Get('v1/visible-vendors/:vendorId/offers')
  async listVisibleOffersOfVendor(
    @Param('vendorId') vendorId: string,
    @Query() request: ListVisibleOffersOfVendorRequest,
  ): Promise<VisibleOfferOfVendorPageResponse> {
    const result = await this.listVisibleOffersOfVendorQuery.execute(
      request.toQueryInput(vendorId),
    );

    return result.pipe(
      Either.map((output) =>
        VisibleOfferOfVendorPageResponse.of(output.getPage(), output.getNow()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
