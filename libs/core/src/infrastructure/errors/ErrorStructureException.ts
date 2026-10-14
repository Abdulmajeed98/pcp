import { StructuredError } from '../../domain/errors/StructuredError';

// Carries the errors a use case returned through the HTTP layer, to the
// filter that answers them. A controller raises it from the left side of an
// `Either`: `Either.getOrThrowWith(ErrorStructureException.of)`.
//
// The errors of one exception are of one kind, and the first one decides the
// status.
export class ErrorStructureException extends Error {
  private constructor(private readonly errors: readonly StructuredError[]) {
    super(errors.map((error) => error.getMessage()).join('; '));
    this.name = ErrorStructureException.name;
  }

  static of(error: StructuredError): ErrorStructureException {
    return new ErrorStructureException([error]);
  }

  static ofAll(errors: readonly StructuredError[]): ErrorStructureException {
    if (errors.length === 0) throw new Error('An exception needs at least one error.');
    return new ErrorStructureException(errors);
  }

  getErrors(): readonly StructuredError[] {
    return this.errors;
  }
}
