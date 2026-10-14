import { Injectable } from '@nestjs/common';
import { NotFoundError, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { PhotoStore } from './PhotoStore';

class Input {
  constructor(private readonly photoId: string) {}

  getPhotoId(): string {
    return this.photoId;
  }
}

class Output {
  private constructor(private readonly image: Buffer) {}

  static of(image: Buffer): Output {
    return new Output(image);
  }

  // The photo as it is kept: WebP.
  getImage(): Buffer {
    return this.image;
  }
}

export { Input as ReadPhotoQueryInput };
export { Output as ReadPhotoQueryOutput };

// One photo, by its identifier. A replaced photo is gone, so its address
// answers as missing.
@Injectable()
export class ReadPhotoQuery {
  constructor(private readonly photoStore: PhotoStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const found = await this.photoStore.readById(input.getPhotoId());

    return Either.flatMap(found, (image) =>
      Option.match(image, {
        onNone: () =>
          Either.left(
            NotFoundError.of('PHOTO_NOT_FOUND', `There is no photo ${input.getPhotoId()}`),
          ),
        onSome: (existing) => Either.right(Output.of(existing)),
      }),
    );
  }
}
