import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule, ErrorModule } from '@pcp/core';
import { ClsModule } from 'nestjs-cls';

import { CallerModule } from '~/infrastructure/caller/caller.module';
import { CategoryModule } from '~/infrastructure/category/category.module';
import { validate } from '~/infrastructure/configuration/env.validation';
import { DatabaseModule } from '~/infrastructure/database/database.module';
import { PartModule } from '~/infrastructure/part/part.module';
import { StatusModule } from '~/infrastructure/status/status.module';

@Module({
  imports: [
    // The settings come from the environment alone. The `.env` file at the
    // repository root belongs to the development services and is not read.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate }),
    // Gives each request a place of its own, where the guard keeps the caller.
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    AuthModule,
    ErrorModule,
    DatabaseModule,
    CallerModule,
    StatusModule,
    CategoryModule,
    PartModule,
  ],
})
export class AppModule {}
