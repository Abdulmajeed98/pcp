import { Global, Module } from '@nestjs/common';

import { DatabaseProvider } from './DatabaseProvider';

@Global()
@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule {}
