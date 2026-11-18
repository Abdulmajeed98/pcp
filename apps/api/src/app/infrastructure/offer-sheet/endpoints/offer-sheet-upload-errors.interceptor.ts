import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ErrorStructureException } from '@pcp/core';
import { catchError, Observable, throwError } from 'rxjs';

import { offerSheetRefused } from '~/domain/offer-sheet/offer-sheet-errors';

// Gives Multer's own refusals of an Offer sheet's upload the answer the use
// case gives, so that the portal meets one shape for each, as a Part's
// photo's interceptor does. A file far too large, which Multer stops before
// it is all received, is `tooLarge`. A form whose file is under another
// name, or that is malformed, is `missing`. It is placed outside Multer's
// interceptor, so that it sees what that one throws.
@Injectable()
export class OfferSheetUploadErrorsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof PayloadTooLargeException) {
          return throwError(() =>
            ErrorStructureException.of(offerSheetRefused('tooLarge')),
          );
        }
        if (error instanceof BadRequestException) {
          return throwError(() => ErrorStructureException.of(offerSheetRefused('missing')));
        }
        return throwError(() => error);
      }),
    );
  }
}
