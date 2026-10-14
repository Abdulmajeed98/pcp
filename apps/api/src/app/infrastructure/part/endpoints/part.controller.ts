import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreatePartCommand } from '~/domain/part/CreatePartCommand';
import { ReadPartQuery, ReadPartQueryInput } from '~/domain/part/ReadPartQuery';

import { CreatePartRequest } from './CreatePartRequest';
import { PartResponse } from './PartResponse';

@Controller()
export class PartController {
  constructor(
    private readonly createPartCommand: CreatePartCommand,
    private readonly readPartQuery: ReadPartQuery,
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
