import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ErrorStructureException, NotValidError } from '@pcp/core';
import { catchError, Observable, throwError } from 'rxjs';

function refused(reason: 'tooLarge' | 'missing'): ErrorStructureException {
  return ErrorStructureException.of(
    NotValidError.of('NOT_VALID', `The photo was refused while it arrived: ${reason}`, {
      field: 'photo',
      reason,
    }),
  );
}

// Gives Multer's own refusals of an upload the answer the use case gives, so
// that a form meets one shape for each. A file far too large, which Multer
// stops before it is all received, is `tooLarge`. A form whose file is under
// another name, or that is malformed, is `missing`. It is placed outside
// Multer's interceptor, so that it sees what that one throws.
@Injectable()
export class PictureUploadErrorsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof PayloadTooLargeException)
          return throwError(() => refused('tooLarge'));
        if (error instanceof BadRequestException)
          return throwError(() => refused('missing'));
        return throwError(() => error);
      }),
    );
  }
}
