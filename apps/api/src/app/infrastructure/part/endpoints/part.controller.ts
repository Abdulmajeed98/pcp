import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreatePartCommand } from '~/domain/part/CreatePartCommand';
import { EditPartCommand } from '~/domain/part/EditPartCommand';
import { ReadPartQuery, ReadPartQueryInput } from '~/domain/part/ReadPartQuery';
import { SearchPartsQuery } from '~/domain/part/SearchPartsQuery';

import { CreatePartRequest } from './CreatePartRequest';
import { EditPartRequest } from './EditPartRequest';
import { PartPageResponse } from './PartPageResponse';
import { PartResponse } from './PartResponse';
import { SearchPartsRequest } from './SearchPartsRequest';

@Controller()
export class PartController {
  constructor(
    private readonly createPartCommand: CreatePartCommand,
    private readonly editPartCommand: EditPartCommand,
    private readonly readPartQuery: ReadPartQuery,
    private readonly searchPartsQuery: SearchPartsQuery,
  ) {}

  @ApiOperation({ summary: 'Add a Part to the catalog' })
  @ApiCreatedResponse({ type: PartResponse })
  @PreAuthorize([Role.ADMIN])
  @Post('v1/parts')
  async createPart(@Body() request: CreatePartRequest): Promise<PartResponse> {
    const result = await this.createPartCommand.execute(request.toCommandInput());

    return result.pipe(
      Either.map((output) => PartResponse.of(output.getPart())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({ summary: 'Replace what the Admin may change in a Part' })
  @ApiOkResponse({ type: PartResponse })
  @PreAuthorize([Role.ADMIN])
  @Put('v1/parts/:partId')
  async editPart(
    @Param('partId') partId: string,
    @Body() request: EditPartRequest,
  ): Promise<PartResponse> {
    const result = await this.editPartCommand.execute(request.toCommandInput(partId));

    return result.pipe(
      Either.map((output) => PartResponse.of(output.getPart())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary: 'One page of the Parts that match a search of the whole catalog',
  })
  @ApiOkResponse({ type: PartPageResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/parts')
  async searchParts(@Query() request: SearchPartsRequest): Promise<PartPageResponse> {
    const result = await this.searchPartsQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) => PartPageResponse.of(output.getPartsPage())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({ summary: 'One Part of the catalog' })
  @ApiOkResponse({ type: PartResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/parts/:partId')
  async readPart(@Param('partId') partId: string): Promise<PartResponse> {
    const result = await this.readPartQuery.execute(new ReadPartQueryInput(partId));

    return result.pipe(
      Either.map((output) => PartResponse.of(output.getPart())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
