import { Either } from 'effect';

// Why a picture was not taken: it is not a JPEG, a PNG or a WebP image, or it
// has more pixels than the API will decode.
export type PictureRefusal = 'notAPhoto' | 'tooManyPixels';

// Makes the photo the platform keeps from a picture the Admin sent: a JPEG, a
// PNG or a WebP image, judged by its content and never by its name, at most
// 1,200 pixels on its longer side and never enlarged, as WebP, with no
// metadata at all, location and camera data among it.
export abstract class PhotoProcessor {
  abstract prepare(picture: Buffer): Promise<Either.Either<Buffer, PictureRefusal>>;
}
