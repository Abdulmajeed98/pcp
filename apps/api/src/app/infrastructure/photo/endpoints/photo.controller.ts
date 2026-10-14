import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import { ReadPhotoQuery, ReadPhotoQueryInput } from '~/domain/photo/ReadPhotoQuery';

import { photosPath } from './photo-path';

// Serves Parts' photos to anyone. A photo never changes at its address, since
// a replaced one gets a new address, so it may be cached for a year by the
// browser and by any cache in front of the API. The browser is told not to
// guess a different type from the bytes.
@Controller()
export class PhotoController {
  constructor(private readonly readPhotoQuery: ReadPhotoQuery) {}

  @ApiOperation({ summary: "A Part's photo", security: [] })
  @ApiProduces('image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Public()
  @Get(`${photosPath}/:photoId`)
  async readPhoto(
    @Param('photoId') photoId: string,
    // Express's response, of which only its headers are set here.
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void },
  ): Promise<StreamableFile> {
    const result = await this.readPhotoQuery.execute(new ReadPhotoQueryInput(photoId));
    const photo = result.pipe(Either.getOrThrowWith(ErrorStructureException.of));

    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(photo.getPhoto(), { type: 'image/webp' });
  }
}
