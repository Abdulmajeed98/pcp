import { NotValidError, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from '../part/Category';
import { specificationListOf } from './specification-lists';
import { SpecificationDocument } from './SpecificationList';

// The specifications the Admin gave for a Part, as they will be kept, or the
// refusal of the first that does not fit its Category's list. The refusal
// names it by its place in the request, `specifications.socket`, as a refused
// field of the request is named. The Admin's form checks values against the
// same list before it sends them, so a refusal here is rare.
export function checkSpecifications(
  category: Category,
  specifications: SpecificationDocument,
): Either.Either<SpecificationDocument, StructuredError> {
  const { document, problems } = specificationListOf(category).check(specifications);
  if (problems.length === 0) return Either.right(document);

  const [first] = problems;
  return Either.left(
    NotValidError.of(
      'NOT_VALID',
      `The specification ${first.path} of a ${category.getKey()} was refused: ${first.reason}`,
      { field: `specifications.${first.path}` },
    ),
  );
}
