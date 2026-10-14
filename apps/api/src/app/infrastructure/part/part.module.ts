import { Module } from '@nestjs/common';

import { CreatePartCommand } from '~/domain/part/CreatePartCommand';
import { EditPartCommand } from '~/domain/part/EditPartCommand';
import { PartStore } from '~/domain/part/PartStore';
import { ReadPartQuery } from '~/domain/part/ReadPartQuery';
import { SearchPartsQuery } from '~/domain/part/SearchPartsQuery';
import { AddPartPhotoCommand } from '~/domain/photo/AddPartPhotoCommand';
import { PhotoProcessor } from '~/domain/photo/PhotoProcessor';
import { PhotoStore } from '~/domain/photo/PhotoStore';
import { ReadPhotoQuery } from '~/domain/photo/ReadPhotoQuery';
import { DatabasePhotoStore } from '~/infrastructure/photo/DatabasePhotoStore';
import { SharpPhotoProcessor } from '~/infrastructure/photo/SharpPhotoProcessor';

import { PartController } from './endpoints/part.controller';
import { PhotoController } from './endpoints/photo.controller';
import { DatabasePartStore } from './store/DatabasePartStore';

@Module({
  controllers: [PartController, PhotoController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: PartStore, useClass: DatabasePartStore },
    { provide: PhotoStore, useClass: DatabasePhotoStore },
    { provide: PhotoProcessor, useClass: SharpPhotoProcessor },
    CreatePartCommand,
    EditPartCommand,
    ReadPartQuery,
    SearchPartsQuery,
    AddPartPhotoCommand,
    ReadPhotoQuery,
  ],
})
export class PartModule {}
