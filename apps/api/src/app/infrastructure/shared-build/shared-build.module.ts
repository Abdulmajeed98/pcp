import { Module } from '@nestjs/common';

import { ReadSharedBuildQuery } from '~/domain/shared-build/ReadSharedBuildQuery';
import { ShareBuildCommand } from '~/domain/shared-build/ShareBuildCommand';
import { SharedBuildStore } from '~/domain/shared-build/SharedBuildStore';
import { BuildModule } from '~/infrastructure/build/build.module';

import { SharedBuildController } from './endpoints/shared-build.controller';
import { DatabaseSharedBuildStore } from './store/DatabaseSharedBuildStore';

@Module({
  // A Build is shared as `GET v1/build` reads it.
  imports: [BuildModule],
  controllers: [SharedBuildController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: SharedBuildStore, useClass: DatabaseSharedBuildStore },
    ShareBuildCommand,
    ReadSharedBuildQuery,
  ],
  // A Referral names the Shared Build it is sent from.
  exports: [SharedBuildStore],
})
export class SharedBuildModule {}
