import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

// Where Parts' photos are kept, one for each Part at most, as the WebP image
// the API serves. It is the port, so that an object store could take the
// place of the database without a change to the domain.
export abstract class PhotoStore {
  // Stores a Part's photo in place of the one it had, which is deleted, and
  // gives the new photo's identifier. Two replacements of one Part's photo at
  // once are taken one after the other.
  abstract replaceForPart(
    partId: string,
    photo: Buffer,
  ): Promise<Either.Either<string, StructuredError>>;

  // The photo with this identifier, or none when there is no such photo.
  abstract readById(
    photoId: string,
  ): Promise<Either.Either<Option.Option<Buffer>, StructuredError>>;
}
