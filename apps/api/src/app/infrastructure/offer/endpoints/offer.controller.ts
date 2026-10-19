import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import {
  ConfirmAllOffersCommand,
  ConfirmAllOffersCommandInput,
} from '~/domain/offer/ConfirmAllOffersCommand';
import { CreateOfferCommand } from '~/domain/offer/CreateOfferCommand';
import { ListVendorsOffersQuery } from '~/domain/offer/ListVendorsOffersQuery';
import { ListVendorsWithExpiringOffersQuery } from '~/domain/offer/ListVendorsWithExpiringOffersQuery';
import { ReadOfferQuery, ReadOfferQueryInput } from '~/domain/offer/ReadOfferQuery';

import { ConfirmedOffersResponse } from './ConfirmedOffersResponse';
import { CreateOfferRequest } from './CreateOfferRequest';
import { ListVendorsOffersRequest } from './ListVendorsOffersRequest';
import { ListVendorsWithExpiringOffersRequest } from './ListVendorsWithExpiringOffersRequest';
import { OfferResponse } from './OfferResponse';
import { VendorsOffersPageResponse } from './VendorsOffersPageResponse';
import { VendorsWithExpiringOffersPageResponse } from './VendorsWithExpiringOffersPageResponse';

// A Vendor's Offers, for the Admin or for the Vendor's own Login, by the rule
// for which Vendor a request acts for; and the Admin's list of the Vendors to
// remind.
@Controller()
export class OfferController {
  constructor(
    private readonly createOfferCommand: CreateOfferCommand,
    private readonly readOfferQuery: ReadOfferQuery,
    private readonly listVendorsOffersQuery: ListVendorsOffersQuery,
    private readonly confirmAllOffersCommand: ConfirmAllOffersCommand,
    private readonly listVendorsWithExpiringOffersQuery: ListVendorsWithExpiringOffersQuery,
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
      "One page of a Vendor's Offers, Expired Offers among them, oldest Confirmation first, with each one's expiry and the Vendor's counts, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: VendorsOffersPageResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId/offers')
  async listVendorsOffers(
    @Param('vendorId') vendorId: string,
    @Query() request: ListVendorsOffersRequest,
  ): Promise<VendorsOffersPageResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.listVendorsOffersQuery.execute(
      request.toQueryInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map(VendorsOffersPageResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "Confirm every Offer of a Vendor, Expired Offers among them, as of now, and answer how many, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: ConfirmedOffersResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  // It answers 200, not 201: nothing is created, and the Offers' times of
  // Confirmation are set. An action on a Vendor's Offers is a POST to a verb
  // after them, as reset-password and deactivate are after a Vendor.
  @HttpCode(HttpStatus.OK)
  @Post('v1/vendors/:vendorId/offers/confirm')
  async confirmAllOffers(
    @Param('vendorId') vendorId: string,
  ): Promise<ConfirmedOffersResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.confirmAllOffersCommand.execute(
      new ConfirmAllOffersCommandInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map(ConfirmedOffersResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'One page of the active Vendors that have Expired Offers or Offers about to expire, most urgent first, each with its phone and WhatsApp numbers and its counts, for the Admin to remind them',
  })
  @ApiOkResponse({ type: VendorsWithExpiringOffersPageResponse })
  // The Admin's only: a Vendor learns nothing about other Vendors.
  @PreAuthorize([Role.ADMIN])
  @Get('v1/offers/expiring')
  async listVendorsWithExpiringOffers(
    @Query() request: ListVendorsWithExpiringOffersRequest,
  ): Promise<VendorsWithExpiringOffersPageResponse> {
    const result = await this.listVendorsWithExpiringOffersQuery.execute(
      request.toQueryInput(),
    );

    return result.pipe(
      Either.map(VendorsWithExpiringOffersPageResponse.of),
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
