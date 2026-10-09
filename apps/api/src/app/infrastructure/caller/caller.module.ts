import { Module } from '@nestjs/common';

import { CallerController } from './endpoints/caller.controller';

@Module({
  controllers: [CallerController],
})
export class CallerModule {}
