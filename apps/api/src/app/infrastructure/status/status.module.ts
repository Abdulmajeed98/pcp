import { Module } from '@nestjs/common';

import { StatusController } from './endpoints/status.controller';

@Module({
  controllers: [StatusController],
})
export class StatusModule {}
