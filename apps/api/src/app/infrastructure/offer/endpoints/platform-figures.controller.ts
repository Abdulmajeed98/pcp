import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import {
  ReadPlatformFiguresQuery,
  ReadPlatformFiguresQueryInput,
} from '~/domain/offer/ReadPlatformFiguresQuery';

import { PlatformFiguresResponse } from './PlatformFiguresResponse';

// The platform's figures, as the Shopper app's home page and a Part's price
// slip print them, for anyone: the Shopper app has no Login. It answers the
// same with a good token, a bad one or none. The Platform Rate's own
// endpoint, with when and by whom it was set, stays the Admin's.
@Controller()
export class PlatformFiguresController {
  constructor(private readonly readPlatformFiguresQuery: ReadPlatformFiguresQuery) {}

  @ApiOperation({
    summary:
      "The platform's figures: how many active Vendors it has, how many Visible Offers it lists, the current Platform Rate in whole dinars per dollar or none, and how many days an Offer stays current without a Confirmation",
    security: [],
  })
  @ApiOkResponse({ type: PlatformFiguresResponse })
  @Public()
  @Get('v1/platform-figures')
  async readPlatformFigures(): Promise<PlatformFiguresResponse> {
    const result = await this.readPlatformFiguresQuery.execute(
      new ReadPlatformFiguresQueryInput(),
    );

    return result.pipe(
      Either.map((output) => PlatformFiguresResponse.of(output.getFigures())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
