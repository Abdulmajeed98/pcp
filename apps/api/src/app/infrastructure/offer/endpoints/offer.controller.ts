import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreateOfferCommand } from '~/domain/offer/CreateOfferCommand';
import { ReadOfferQuery, ReadOfferQueryInput } from '~/domain/offer/ReadOfferQuery';

import { CreateOfferRequest } from './CreateOfferRequest';
import { OfferResponse } from './OfferResponse';

// A Vendor's Offers, for the Admin or for the Vendor's own Login, by the rule
// for which Vendor a request acts for.
@Controller()
export class OfferController {
  constructor(
    private readonly createOfferCommand: CreateOfferCommand,
    private readonly readOfferQuery: ReadOfferQuery,
    private readonly callerResolver: CallerResolver,
  ) {}

  @ApiOperation({
    summary:
      "Add a Vendor's Offer for a Part, which is its first Confirmation, for the Admin or for the Vendor's own Login",
  })
  @ApiCreatedResponse({ type: OfferResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Post('v1/vendors/:vendorId/offers')
  async createOffer(
    @Param('vendorId') vendorId: string,
    @Body() request: CreateOfferRequest,
  ): Promise<OfferResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.createOfferCommand.execute(
      request.toCommandInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map((output) => OfferResponse.of(output.getOffer())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "One of a Vendor's Offers, with its Part, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: OfferResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId/offers/:offerId')
  async readOffer(
    @Param('vendorId') vendorId: string,
    @Param('offerId') offerId: string,
  ): Promise<OfferResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.readOfferQuery.execute(
      new ReadOfferQueryInput(caller.getId(), caller.getRoles(), vendorId, offerId),
    );

    return result.pipe(
      Either.map((output) => OfferResponse.of(output.getOffer())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
