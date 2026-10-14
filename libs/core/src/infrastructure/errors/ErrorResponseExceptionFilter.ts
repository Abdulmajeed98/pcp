import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ErrorType, StructuredError } from '../../domain/errors/StructuredError';
import { ErrorResponse, SubErrorResponse } from './endpoints/ErrorResponse';
import { ErrorStructureException } from './ErrorStructureException';

// The status each kind of error a use case returns is answered with.
const statusesByErrorType: Record<ErrorType, number> = {
  SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
};

// The statuses that have an error of their own. Any other status an endpoint
// answers with is told apart by the status in its code.
const errorsByStatus = new Map<number, SubErrorResponse>([
  [
    HttpStatus.UNAUTHORIZED,
    new SubErrorResponse('UNAUTHORIZED', 'unauthorized_title', 'unauthorized_details'),
  ],
  [
    HttpStatus.FORBIDDEN,
    new SubErrorResponse('ACCESS_DENIED', 'access_denied_title', 'access_denied_details'),
  ],
  [
    HttpStatus.NOT_FOUND,
    new SubErrorResponse('NOT_FOUND', 'not_found_title', 'not_found_details'),
  ],
  [
    HttpStatus.SERVICE_UNAVAILABLE,
    new SubErrorResponse(
      'SERVICE_UNAVAILABLE',
      'service_unavailable_title',
      'service_unavailable_details',
    ),
  ],
]);

const internalServerError = new SubErrorResponse(
  'INTERNAL_SERVER_ERROR',
  'internal_server_error_title',
  'internal_server_error_details',
);

function subErrorOf(error: StructuredError): SubErrorResponse {
  return new SubErrorResponse(
    error.getCode(),
    error.getTitle(),
    error.getDetail(),
    error.getAdditionalInformation(),
  );
}

// What the API answers to an error: the status and the errors in the body.
type Answer = { status: number; errors: SubErrorResponse[] };

// Gives every error the API answers the same body. What an exception says is
// never put into the body, so nothing about the inside of the API leaves it.
@Catch()
export class ErrorResponseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorResponseExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, errors } =
      exception instanceof ErrorStructureException
        ? this.answerToUseCase(exception)
        : this.answerToException(exception);

    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      new ErrorResponse(errors),
      status,
    );
  }

  // The errors a use case returned, each with its own code. A server error
  // says what failed in the log only, and is answered as any other internal
  // error is.
  private answerToUseCase(exception: ErrorStructureException): Answer {
    const structuredErrors = exception.getErrors();
    const status = statusesByErrorType[structuredErrors[0].getType()];

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.message);
      return { status, errors: [internalServerError] };
    }

    return { status, errors: structuredErrors.map(subErrorOf) };
  }

  private answerToException(exception: unknown): Answer {
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, errors: [internalServerError] };
    }

    const status = exception.getStatus();
    const error =
      errorsByStatus.get(status) ??
      new SubErrorResponse(`HTTP_${status}`, 'http_error_title', 'http_error_details');
    return { status, errors: [error] };
  }
}
