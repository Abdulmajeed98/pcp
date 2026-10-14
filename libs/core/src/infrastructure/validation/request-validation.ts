import { ValidationError, ValidationPipe } from '@nestjs/common';

import { NotValidError } from '../../domain/errors/StructuredError';
import { ErrorStructureException } from '../errors/ErrorStructureException';

// Every field a refused request got wrong, by its path in the body: `name`,
// or `specifications.socket` for a field inside another, or `rows.0.lanes`
// for one inside a list.
function invalidFieldsOf(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const path = parentPath === '' ? error.property : `${parentPath}.${error.property}`;
    const own = Object.keys(error.constraints ?? {}).length > 0 ? [path] : [];

    return [...own, ...invalidFieldsOf(error.children ?? [], path)];
  });
}

// Checks each request against its Request class before the endpoint sees it.
// A field the class does not declare is refused, and so is one that breaks a
// rule. The answer names every field, one error each, so that a form can show
// each refusal beside its field.
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      ErrorStructureException.ofAll(
        invalidFieldsOf(errors).map((field) =>
          NotValidError.of('NOT_VALID', `The request's ${field} is not valid`, { field }),
        ),
      ),
  });
}
