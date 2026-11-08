import { Module } from '@nestjs/common';

import { BuildReading } from '~/domain/build/BuildReading';
import { BuildStore } from '~/domain/build/BuildStore';
import { ReadBuildQuery } from '~/domain/build/ReadBuildQuery';

import { BuildController } from './endpoints/build.controller';
import { DatabaseBuildStore } from './store/DatabaseBuildStore';

@Module({
  controllers: [BuildController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: BuildStore, useClass: DatabaseBuildStore },
    BuildReading,
    ReadBuildQuery,
  ],
  // Every endpoint that takes a Build, those of other modules among them,
  // reads it by the same reading.
  exports: [BuildReading],
})
export class BuildModule {}
