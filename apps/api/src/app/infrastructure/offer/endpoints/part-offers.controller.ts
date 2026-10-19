import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import {
  ListVisibleOffersOfPartQuery,
  ListVisibleOffersOfPartQueryInput,
} from '~/domain/offer/ListVisibleOffersOfPartQuery';

import { VisibleOfferResponse } from './VisibleOfferResponse';

// A Part's Offers as Shoppers see them, for anyone: the Shopper app has no
// Login. It answers the same with a good token, a bad one or none.
@Controller()
export class PartOffersController {
  constructor(
    private readonly listVisibleOffersOfPartQuery: ListVisibleOffersOfPartQuery,
  ) {}

  @ApiOperation({
    summary:
      "A Part's visible Offers: not Expired Offers, of active Vendors only, in-stock first and then the most recent Confirmation first, each with how many days ago it was confirmed",
    security: [],
  })
  @ApiOkResponse({ type: [VisibleOfferResponse] })
  @Public()
  @Get('v1/parts/:partId/offers')
  async listVisibleOffersOfPart(
    @Param('partId') partId: string,
  ): Promise<VisibleOfferResponse[]> {
    const result = await this.listVisibleOffersOfPartQuery.execute(
      new ListVisibleOffersOfPartQueryInput(partId),
    );

    return result.pipe(
      Either.map((output) =>
        output.getOffers().map(VisibleOfferResponse.at(output.getNow())),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
