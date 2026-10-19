import { ServerError, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';
import { partPhoto } from '~/infrastructure/photo/photo.schema';

import { part, PartRow } from './part.schema';

// A Part's row and its photo's identifier, as a read gives them, for every
// Store that reads Parts.
export const partWithPhoto = { part, photoId: partPhoto.id };

// A row as a Part. The database's own list of Categories is made from the
// domain's, so a row whose Category the domain does not know means the two
// have drifted apart.
export function partOf(
  row: PartRow,
  photoId: string | null,
): Either.Either<Part, StructuredError> {
  const category = Category.withKey(row.category);
  if (category === undefined) {
    return Either.left(
      ServerError.of(`A Part has a Category the API does not know: ${row.category}`),
    );
  }

  return Either.right(
    new Part(
      row.id,
      category,
      row.name,
      row.manufacturer,
      row.partNumbers,
      row.openDbId,
      row.specifications,
      row.createdAt,
      row.updatedAt,
      photoId,
    ),
  );
}
