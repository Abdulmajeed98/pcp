import { NotValidError, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from '../part/Category';
import { specificationListOf } from './specification-lists';
import { SpecificationDocument } from './specification-document';

// The specifications the Admin gave for a Part, as they will be kept, or the
// refusal of the first that does not fit its Category's list. The refusal
// says which field of the request it is about, `specifications.cores.total`,
// as a refused field of a request is named, and gives the specification's own
// path, `cores.total`, as the Part's missing specifications name it, and the
// reason, so that a form can say what is wrong beside the field. The Admin's
// form is to check values against the same list before it sends them, so
// that a refusal here is rare and naming the first is enough.
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
      {
        field: `specifications.${first.path}`,
        specification: first.path,
        reason: first.reason,
      },
    ),
  );
}
