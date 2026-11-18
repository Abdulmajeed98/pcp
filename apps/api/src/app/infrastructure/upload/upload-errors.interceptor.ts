import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  PayloadTooLargeException,
  Type,
} from '@nestjs/common';
import { ErrorStructureException, NotValidError } from '@pcp/core';
import { catchError, Observable, throwError } from 'rxjs';

// Why Multer refused an upload's file while it arrived.
type RefusedWhileItArrived = 'tooLarge' | 'missing';

function refused(field: string, reason: RefusedWhileItArrived): ErrorStructureException {
  return ErrorStructureException.of(
    NotValidError.of('NOT_VALID', `The ${field} was refused while it arrived: ${reason}`, {
      field,
      reason,
    }),
  );
}

// Gives Multer's own refusals of an upload the answer the use case gives,
// naming the form's field, so that a form meets one shape for each: a
// Part's photo, `photo`, and an Offer sheet, `offerSheet`. A file far too
// large, which Multer stops before it is all received, is `tooLarge`. A
// form whose file is under another name, or that is malformed, is
// `missing`. It is placed outside Multer's interceptor, so that it sees
// what that one throws, and takes the field Multer's interceptor takes.
export function UploadErrorsInterceptor(field: string): Type<NestInterceptor> {
  @Injectable()
  class UploadErrors implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
      return next.handle().pipe(
        catchError((error: unknown) => {
          if (error instanceof PayloadTooLargeException) {
            return throwError(() => refused(field, 'tooLarge'));
          }
          if (error instanceof BadRequestException) {
            return throwError(() => refused(field, 'missing'));
          }
          return throwError(() => error);
        }),
      );
    }
  }
  return mixin(UploadErrors);
}
