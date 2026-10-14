import { Injectable } from '@nestjs/common';
import { Option } from 'effect';
import sharp from 'sharp';

import { PhotoProcessor } from '~/domain/photo/PhotoProcessor';

const acceptedFormats = new Set(['jpeg', 'png', 'webp']);
const longestSide = 1200;

// A picture with more pixels than this is refused before it is decoded, so
// that a small file that unpacks into a huge image cannot exhaust the API's
// memory. It is well above a phone camera's 50 megapixels.
const largestPixels = 100_000_000;

@Injectable()
export class SharpPhotoProcessor implements PhotoProcessor {
  async prepare(picture: Buffer): Promise<Option.Option<Buffer>> {
    try {
      // sharp tells the format from the picture's content, whatever it was
      // called or said to be.
      const image = sharp(picture, { limitInputPixels: largestPixels });
      const { format } = await image.metadata();
      if (format === undefined || !acceptedFormats.has(format)) return Option.none();

      // Turned upright by its EXIF orientation first, because the output keeps
      // no metadata, the orientation included. sharp writes none by default.
      const photo = await image
        .rotate()
        .resize({
          width: longestSide,
          height: longestSide,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp()
        .toBuffer();
      return Option.some(photo);
    } catch {
      return Option.none();
    }
  }
}
