import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AccessTokenVerifier } from './AccessTokenVerifier';
import { AuthGuard } from './AuthGuard';
import { CallerResolver } from './CallerResolver';

// Puts the guard in front of every endpoint of the application that imports
// it. The application also has to import `ClsModule`, with its middleware
// mounted, which is what gives each request a place of its own for the caller.
@Global()
@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    AccessTokenVerifier,
    CallerResolver,
  ],
  exports: [CallerResolver],
})
export class AuthModule {}
