import { Module } from '@nestjs/common';

import { PlatformRateStore } from '~/domain/platform-rate/PlatformRateStore';
import { ReadPlatformRateQuery } from '~/domain/platform-rate/ReadPlatformRateQuery';
import { SetPlatformRateCommand } from '~/domain/platform-rate/SetPlatformRateCommand';

import { PlatformRateController } from './endpoints/platform-rate.controller';
import { DatabasePlatformRateStore } from './store/DatabasePlatformRateStore';

@Module({
  controllers: [PlatformRateController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: PlatformRateStore, useClass: DatabasePlatformRateStore },
    ReadPlatformRateQuery,
    SetPlatformRateCommand,
  ],
})
export class PlatformRateModule {}
