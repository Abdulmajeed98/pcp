import { Injectable } from '@nestjs/common';
import { NotValidError, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PhotoProcessor, PictureRefusal } from '../photo/PhotoProcessor';
import { PhotoStore } from '../photo/PhotoStore';
import { Part } from './Part';
import { partNotFound } from './part-errors';
import { PartStore } from './PartStore';

// The largest picture the Admin may send. A photo from a phone's camera is
// well under it.
export const LARGEST_PICTURE_BYTES = 10 * 1024 * 1024;

class Input {
  constructor(
    private readonly partId: string,
    private readonly picture: Buffer | undefined,
  ) {}

  getPartId(): string {
    return this.partId;
  }

  // What the Admin sent, if anything.
  getPicture(): Buffer | undefined {
    return this.picture;
  }
}

class Output {
  private constructor(private readonly part: Part) {}

  static of(part: Part): Output {
    return new Output(part);
  }

  getPart(): Part {
    return this.part;
  }
}

export { Input as AddPartPhotoCommandInput };
export { Output as AddPartPhotoCommandOutput };

function refused(reason: 'missing' | 'tooLarge' | PictureRefusal): NotValidError {
  return NotValidError.of('NOT_VALID', `The photo was refused: ${reason}`, {
    field: 'photo',
    reason,
  });
}

// The Admin adds a photo to a Part, or replaces the one it has (CAT-5).
@Injectable()
export class AddPartPhotoCommand {
  constructor(
    private readonly partStore: PartStore,
    private readonly photoStore: PhotoStore,
    private readonly photoProcessor: PhotoProcessor,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const picture = input.getPicture();
    if (picture === undefined) return Either.left(refused('missing'));
    if (picture.length > LARGEST_PICTURE_BYTES) return Either.left(refused('tooLarge'));

    const found = await this.partStore.readById(input.getPartId());
    if (Either.isLeft(found)) return Either.left(found.left);
    if (Option.isNone(found.right)) return Either.left(partNotFound(input.getPartId()));

    const photo = await this.photoProcessor.prepare(picture);
    if (Either.isLeft(photo)) return Either.left(refused(photo.left));

    const stored = await this.photoStore.replaceForPart(input.getPartId(), photo.right);
    if (Either.isLeft(stored)) return Either.left(stored.left);

    const withPhoto = await this.partStore.readById(input.getPartId());
    return Either.flatMap(withPhoto, (part) =>
      Option.match(part, {
        onNone: () => Either.left(partNotFound(input.getPartId())),
        onSome: (existing) => Either.right(Output.of(existing)),
      }),
    );
  }
}
