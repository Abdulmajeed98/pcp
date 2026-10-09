import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ErrorResponse, SubErrorResponse } from './endpoints/ErrorResponse';

// The statuses that have an error of their own. Any other status an endpoint
// answers with is told apart by the status in its code.
const errorsByStatus = new Map<number, SubErrorResponse>([
  [
    HttpStatus.NOT_FOUND,
    new SubErrorResponse('NOT_FOUND', 'not_found_title', 'not_found_details'),
  ],
]);

const internalServerError = new SubErrorResponse(
  'INTERNAL_SERVER_ERROR',
  'internal_server_error_title',
  'internal_server_error_details',
);

// Gives every error the API answers the same body. What an exception says is
// never put into the body, so nothing about the inside of the API leaves it.
@Catch()
export class ErrorResponseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorResponseExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, error } = this.errorFor(exception);

    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      new ErrorResponse([error]),
      status,
    );
  }

  private errorFor(exception: unknown): { status: number; error: SubErrorResponse } {
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, error: internalServerError };
    }

    const status = exception.getStatus();
    const error =
      errorsByStatus.get(status) ??
      new SubErrorResponse(`HTTP_${status}`, 'http_error_title', 'http_error_details');
    return { status, error };
  }
}
