import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import {
  AddPartPhotoCommand,
  AddPartPhotoCommandInput,
  LARGEST_PICTURE_BYTES,
} from '~/domain/part/AddPartPhotoCommand';
import { CreatePartCommand } from '~/domain/part/CreatePartCommand';

import { EditPartCommand } from '~/domain/part/EditPartCommand';
import { ReadPartQuery, ReadPartQueryInput } from '~/domain/part/ReadPartQuery';
import { SearchPartsQuery } from '~/domain/part/SearchPartsQuery';

import { CreatePartRequest } from './CreatePartRequest';
import { EditPartRequest } from './EditPartRequest';
import { PartPageResponse } from './PartPageResponse';
import { PartResponse } from './PartResponse';
import { PictureUploadErrorsInterceptor } from './picture-upload-errors.interceptor';
import { SearchPartsRequest } from './SearchPartsRequest';

@Controller()
export class PartController {
  constructor(
    private readonly createPartCommand: CreatePartCommand,
    private readonly editPartCommand: EditPartCommand,
    private readonly readPartQuery: ReadPartQuery,
    private readonly searchPartsQuery: SearchPartsQuery,
    private readonly addPartPhotoCommand: AddPartPhotoCommand,
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

  @ApiOperation({ summary: 'Add a photo to a Part, in place of the one it has' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'A JPEG, PNG or WebP picture of up to 10 MB.',
        },
      },
    },
  })
  @ApiOkResponse({ type: PartResponse })
  @PreAuthorize([Role.ADMIN])
  @Put('v1/parts/:partId/photo')
  // A picture somewhat over the largest is still received, so that the use
  // case refuses it naming the field. One far over it is refused as it
  // arrives, before it fills the API's memory.
  @UseInterceptors(
    PictureUploadErrorsInterceptor,
    FileInterceptor('photo', {
      limits: { fileSize: LARGEST_PICTURE_BYTES + 2 * 1024 * 1024 },
    }),
  )
  async addPartPhoto(
    @Param('partId') partId: string,
    // The file as Multer receives it, kept in memory. Only its bytes are used.
    @UploadedFile() photo: { buffer: Buffer } | undefined,
  ): Promise<PartResponse> {
    const result = await this.addPartPhotoCommand.execute(
      new AddPartPhotoCommandInput(partId, photo?.buffer),
    );

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
