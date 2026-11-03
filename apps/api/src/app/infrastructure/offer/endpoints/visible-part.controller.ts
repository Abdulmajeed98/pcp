import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import {
  ReadVisiblePartQuery,
  ReadVisiblePartQueryInput,
} from '~/domain/offer/ReadVisiblePartQuery';

import { VisiblePartWithSpecificationsResponse } from './VisiblePartWithSpecificationsResponse';

// One Visible Part, as a Part page shows it, for anyone: the Shopper app has
// no Login. It answers the same with a good token, a bad one or none.
@Controller()
export class VisiblePartController {
  constructor(private readonly readVisiblePartQuery: ReadVisiblePartQuery) {}

  @ApiOperation({
    summary:
      'A Visible Part, a Part with at least one Visible Offer, with its specifications labelled in English; a Part that is not visible is answered as one that does not exist',
    security: [],
  })
  @ApiOkResponse({ type: VisiblePartWithSpecificationsResponse })
  @Public()
  @Get('v1/visible-parts/:partId')
  async readVisiblePart(
    @Param('partId') partId: string,
  ): Promise<VisiblePartWithSpecificationsResponse> {
    const result = await this.readVisiblePartQuery.execute(
      new ReadVisiblePartQueryInput(partId),
    );

    return result.pipe(
      Either.map((output) => VisiblePartWithSpecificationsResponse.of(output.getPart())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
