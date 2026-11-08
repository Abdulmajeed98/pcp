import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { ReadBuildQuery } from '~/domain/build/ReadBuildQuery';

import { BuildResponse } from './BuildResponse';
import { ReadBuildRequest } from './ReadBuildRequest';

// A Build, read for anyone: the Shopper app has no Login, and keeps the
// Build itself. It answers the same with a good token, a bad one or none.
@Controller()
export class BuildController {
  constructor(private readonly readBuildQuery: ReadBuildQuery) {}

  @ApiOperation({
    summary:
      'A Build that the request gives and nothing stores: its Parts as the catalog holds them, each with its quantity and whether it is a Visible Part, and whether it is a Complete Build, with the Categories it still needs',
    security: [],
  })
  @ApiOkResponse({ type: BuildResponse })
  @Public()
  @Get('v1/build')
  async readBuild(@Query() request: ReadBuildRequest): Promise<BuildResponse> {
    const result = await this.readBuildQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) => BuildResponse.of(output.getBuild(), output.getCompleteness())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
