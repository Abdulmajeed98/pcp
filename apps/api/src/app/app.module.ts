import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ErrorModule } from '@pcp/core';

import { validate } from '~/infrastructure/configuration/env.validation';
import { StatusModule } from '~/infrastructure/status/status.module';

@Module({
  imports: [
    // The settings come from the environment alone. The `.env` file at the
    // repository root belongs to the development services and is not read.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate }),
    ErrorModule,
    StatusModule,
  ],
})
export class AppModule {}
