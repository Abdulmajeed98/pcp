import { Module } from '@nestjs/common';

import { PlaceholderController } from './endpoints/placeholder.controller';

@Module({
  controllers: [PlaceholderController],
})
export class PlaceholderModule {}
