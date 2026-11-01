import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either, Option } from 'effect';

import {
  ReadPlatformRateQuery,
  ReadPlatformRateQueryInput,
} from '~/domain/platform-rate/ReadPlatformRateQuery';
import { SetPlatformRateCommand } from '~/domain/platform-rate/SetPlatformRateCommand';

import { PlatformRateResponse } from './PlatformRateResponse';
import { SetPlatformRateRequest } from './SetPlatformRateRequest';

// The Platform Rate, for the Admin alone: no Vendor reads or changes what
// every Shopper's Converted Prices are derived from.
@Controller()
export class PlatformRateController {
  constructor(
    private readonly readPlatformRateQuery: ReadPlatformRateQuery,
    private readonly setPlatformRateCommand: SetPlatformRateCommand,
    private readonly callerResolver: CallerResolver,
  ) {}

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

  @ApiOperation({
    summary:
      'Set the Platform Rate, in whole dinars per dollar, as a new setting, also when it equals the current one, and answer it as the current one',
  })
  @ApiOkResponse({ type: PlatformRateResponse })
  @PreAuthorize([Role.ADMIN])
  @Put('v1/platform-rate')
  async setPlatformRate(
    @Body() request: SetPlatformRateRequest,
  ): Promise<PlatformRateResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.setPlatformRateCommand.execute(
      request.toCommandInput(caller.getId()),
    );

    return result.pipe(
      Either.map((output) => PlatformRateResponse.of(Option.some(output.getRate()))),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
