import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { RecordReferralCommand } from '~/domain/referral/RecordReferralCommand';

import { RecordReferralRequest } from './RecordReferralRequest';
import { ReferralResponse } from './ReferralResponse';

// A Shared Build's Referrals, recorded by anyone: the Shopper app has no
// Login. It answers the same with a good token, a bad one or none. A public
// endpoint has a controller of its own, as a Part's Offers do
// (`PartOffersController`), apart from the counts the Admin and a Vendor's
// own Login read (`ReferralController`), and none of it answers a count.
@Controller()
export class SharedBuildReferralsController {
  constructor(private readonly recordReferralCommand: RecordReferralCommand) {}

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
}
