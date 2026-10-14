import { Injectable, Logger } from '@nestjs/common';
import { Either } from 'effect';
import sharp from 'sharp';

import { PhotoProcessor, PictureRefusal } from '~/domain/photo/PhotoProcessor';

const acceptedFormats = new Set(['jpeg', 'png', 'webp']);
const longestSide = 1200;

// The most pixels the API will decode. A small file can unpack into a huge
// image, and decoding 100 million pixels already takes about 300 MB. A phone
// can take pictures of up to 200 megapixels, but those are larger than the
// 10 MB the API takes anyway.
const largestPixels = 100_000_000;

@Injectable()
export class SharpPhotoProcessor implements PhotoProcessor {
  private readonly logger = new Logger(SharpPhotoProcessor.name);

  async prepare(picture: Buffer): Promise<Either.Either<Buffer, PictureRefusal>> {
    try {
      // sharp tells the format and the size from the picture's own header,
      // whatever it was called or said to be, and decodes nothing to do so.
      // Its own limit on pixels already applies to reading the header, so the
      // header is read without it, and the size is checked here.
      const { format, width, height } = await sharp(picture, {
        limitInputPixels: false,
      }).metadata();
      if (format === undefined || !acceptedFormats.has(format)) {
        return Either.left('notAPhoto');
      }
      if (width * height > largestPixels) return Either.left('tooManyPixels');

      // Turned upright by its EXIF orientation first, because the output keeps
      // no metadata, the orientation included. sharp writes none by default.
      // The limit stays on the decoding itself.
      const photo = await sharp(picture, { limitInputPixels: largestPixels })
        .rotate()
        .resize({
          width: longestSide,
          height: longestSide,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp()
        .toBuffer();
      return Either.right(photo);
    } catch (error) {
      // A picture that cannot be read or decoded. What sharp said goes to the
      // log, so that a refusal can be looked into.
      this.logger.warn(`A picture was refused: ${(error as Error).message}`);
      return Either.left('notAPhoto');
    }
  }
}
