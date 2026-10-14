import { Module } from '@nestjs/common';

import { CreatePartCommand } from '~/domain/part/CreatePartCommand';
import { PartStore } from '~/domain/part/PartStore';
import { ReadPartQuery } from '~/domain/part/ReadPartQuery';

import { PartController } from './endpoints/part.controller';
import { DatabasePartStore } from './store/DatabasePartStore';

@Module({
  controllers: [PartController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: PartStore, useClass: DatabasePartStore },
    CreatePartCommand,
    ReadPartQuery,
  ],
})
export class PartModule {}
