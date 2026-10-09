import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { ErrorResponseExceptionFilter } from './ErrorResponseExceptionFilter';

@Global()
@Module({
  providers: [{ provide: APP_FILTER, useClass: ErrorResponseExceptionFilter }],
})
export class ErrorModule {}
