import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import {
  ReadSharedBuildQuery,
  ReadSharedBuildQueryInput,
} from '~/domain/shared-build/ReadSharedBuildQuery';
import { ShareBuildCommand } from '~/domain/shared-build/ShareBuildCommand';

import { BuildSharedResponse } from './BuildSharedResponse';
import { SharedBuildResponse } from './SharedBuildResponse';
import { ShareBuildRequest } from './ShareBuildRequest';

// What an endpoint sets on the response it answers through, its status, and
// nothing else of it.
type AnsweredStatus = { status(code: number): unknown };

// Shared Builds, for anyone: the Shopper app has no Login. Each endpoint
// answers the same with a good token, a bad one or none.
@Controller()
export class SharedBuildController {
  constructor(
    private readonly shareBuildCommand: ShareBuildCommand,
    private readonly readSharedBuildQuery: ReadSharedBuildQuery,
  ) {}

  @ApiOperation({
    summary:
      'Share a Build: freeze the Parts of it the catalog holds, with their quantities, as a Shared Build that never changes, and answer it, a new one, or the one an earlier share of the same Build stored',
    security: [],
  })
  @ApiCreatedResponse({
    type: BuildSharedResponse,
    description: 'A new Shared Build, stored now.',
  })
  @ApiOkResponse({
    type: BuildSharedResponse,
    description:
      'The Shared Build an earlier share of the same Build stored, as it was stored.',
  })
  @Public()
  @Post('v1/shared-builds')
  async shareBuild(
    @Body() request: ShareBuildRequest,
    @Res({ passthrough: true }) response: AnsweredStatus,
  ): Promise<BuildSharedResponse> {
    const result = await this.shareBuildCommand.execute(request.toCommandInput());

    return result.pipe(
      Either.map((output) => {
        const shared = output.getShared();
        // 201 when this share stored it, which a POST answers unless told,
        // and 200 when an earlier share had.
        if (!shared.isStoredNow()) response.status(HttpStatus.OK);
        return BuildSharedResponse.of(shared.getSharedBuild());
      }),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "A Shared Build's frozen Parts and quantities, as `GET v1/build` takes them, never changed since it was shared, and when it was shared",
    security: [],
  })
  @ApiOkResponse({ type: SharedBuildResponse })
  @Public()
  @Get('v1/shared-builds/:sharedBuildId')
  async readSharedBuild(
    @Param('sharedBuildId') sharedBuildId: string,
  ): Promise<SharedBuildResponse> {
    const result = await this.readSharedBuildQuery.execute(
      new ReadSharedBuildQueryInput(sharedBuildId),
    );

    return result.pipe(
      Either.map((output) => SharedBuildResponse.of(output.getSharedBuild())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
