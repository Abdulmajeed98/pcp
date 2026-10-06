import { Module } from '@nestjs/common';

import { PlaceholderModule } from '~/infrastructure/placeholder/placeholder.module';

@Module({
  imports: [PlaceholderModule],
})
export class AppModule {}
