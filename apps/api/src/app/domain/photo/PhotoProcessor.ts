import { Option } from 'effect';

// Makes the photo the platform keeps from a picture the Admin sent: a JPEG, a
// PNG or a WebP image, judged by its content and never by its name, at most
// 1,200 pixels on its longer side and never enlarged, as WebP, with no
// metadata at all, location and camera data among it. Anything that is not
// such a picture gives none.
export abstract class PhotoProcessor {
  abstract prepare(picture: Buffer): Promise<Option.Option<Buffer>>;
}
