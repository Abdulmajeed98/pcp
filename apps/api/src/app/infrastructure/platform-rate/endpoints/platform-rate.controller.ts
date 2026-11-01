import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import {
  ReadPlatformRateQuery,
  ReadPlatformRateQueryInput,
} from '~/domain/platform-rate/ReadPlatformRateQuery';

import { PlatformRateResponse } from './PlatformRateResponse';

// The Platform Rate, for the Admin alone: no Vendor reads or changes what
// every Shopper's Converted Prices are derived from.
@Controller()
export class PlatformRateController {
  constructor(private readonly readPlatformRateQuery: ReadPlatformRateQuery) {}

  @ApiOperation({
    summary:
      'The current Platform Rate, in whole dinars per dollar, and when it was set, or none until the Admin sets the first',
  })
  @ApiOkResponse({ type: PlatformRateResponse })
  @PreAuthorize([Role.ADMIN])
  @Get('v1/platform-rate')
  async readPlatformRate(): Promise<PlatformRateResponse> {
    const result = await this.readPlatformRateQuery.execute(
      new ReadPlatformRateQueryInput(),
    );

    return result.pipe(
      Either.map((output) => PlatformRateResponse.of(output.getCurrent())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
