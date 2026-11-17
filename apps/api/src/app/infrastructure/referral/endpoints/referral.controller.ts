import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { ListReferralCountsQuery } from '~/domain/referral/ListReferralCountsQuery';
import {
  ReadVendorsReferralCountQuery,
  ReadVendorsReferralCountQueryInput,
} from '~/domain/referral/ReadVendorsReferralCountQuery';

import { ListReferralCountsRequest } from './ListReferralCountsRequest';
import { ReferralCountResponse } from './ReferralCountResponse';
import { ReferralCountsPageResponse } from './ReferralCountsPageResponse';

// Referral counts, for the Admin, or for a Vendor's own Login by the rule
// for which Vendor a request acts for. Referrals are recorded by anyone, at
// a public endpoint in a controller of its own
// (`SharedBuildReferralsController`), and no public endpoint answers a
// count.
@Controller()
export class ReferralController {
  constructor(
    private readonly listReferralCountsQuery: ListReferralCountsQuery,
    private readonly readVendorsReferralCountQuery: ReadVendorsReferralCountQuery,
    private readonly callerResolver: CallerResolver,
  ) {}

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
