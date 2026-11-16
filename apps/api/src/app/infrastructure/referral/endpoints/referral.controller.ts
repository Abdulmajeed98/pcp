import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import {
  CallerResolver,
  ErrorStructureException,
  PreAuthorize,
  Public,
  Role,
} from '@pcp/core';
import { Either } from 'effect';

import { ListReferralCountsQuery } from '~/domain/referral/ListReferralCountsQuery';
import {
  ReadVendorsReferralCountQuery,
  ReadVendorsReferralCountQueryInput,
} from '~/domain/referral/ReadVendorsReferralCountQuery';
import { RecordReferralCommand } from '~/domain/referral/RecordReferralCommand';

import { ListReferralCountsRequest } from './ListReferralCountsRequest';
import { RecordReferralRequest } from './RecordReferralRequest';
import { ReferralCountResponse } from './ReferralCountResponse';
import { ReferralCountsPageResponse } from './ReferralCountsPageResponse';
import { ReferralResponse } from './ReferralResponse';

// Referrals: recorded by anyone, since the Shopper app has no Login, and
// counted for the Admin, or for a Vendor's own Login by the rule for which
// Vendor a request acts for. No public endpoint answers a count.
@Controller()
export class ReferralController {
  constructor(
    private readonly recordReferralCommand: RecordReferralCommand,
    private readonly listReferralCountsQuery: ListReferralCountsQuery,
    private readonly readVendorsReferralCountQuery: ReadVendorsReferralCountQuery,
    private readonly callerResolver: CallerResolver,
  ) {}

  @ApiOperation({
    summary:
      'Record a Referral: one tap on "send on WhatsApp", which sends a Shared Build to an active Vendor that gave a WhatsApp number, and answer the Vendor with its number, so that the chat can be opened. Each call is one Referral, and nothing about the Shopper is recorded',
    security: [],
  })
  @ApiCreatedResponse({ type: ReferralResponse })
  @Public()
  @Post('v1/shared-builds/:sharedBuildId/referrals')
  async recordReferral(
    @Param('sharedBuildId') sharedBuildId: string,
    @Body() request: RecordReferralRequest,
  ): Promise<ReferralResponse> {
    const result = await this.recordReferralCommand.execute(
      request.toCommandInput(sharedBuildId),
    );

    return result.pipe(
      Either.map(ReferralResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'One page of every Vendor, active and deactivated, with its Referral count, zeros included, the most Referrals first, for the Admin',
  })
  @ApiOkResponse({ type: ReferralCountsPageResponse })
  // The Admin's only: a Vendor learns nothing about other Vendors.
  @PreAuthorize([Role.ADMIN])
  @Get('v1/referral-counts')
  async listReferralCounts(
    @Query() request: ListReferralCountsRequest,
  ): Promise<ReferralCountsPageResponse> {
    const result = await this.listReferralCountsQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map(ReferralCountsPageResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "A Vendor's Referral count, over all time, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: ReferralCountResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId/referral-count')
  async readVendorsReferralCount(
    @Param('vendorId') vendorId: string,
  ): Promise<ReferralCountResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.readVendorsReferralCountQuery.execute(
      new ReadVendorsReferralCountQueryInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map(ReferralCountResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
