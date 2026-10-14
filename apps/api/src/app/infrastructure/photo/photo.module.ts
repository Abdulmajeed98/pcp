import { Module } from '@nestjs/common';

import { PhotoProcessor } from '~/domain/photo/PhotoProcessor';
import { PhotoStore } from '~/domain/photo/PhotoStore';
import { ReadPhotoQuery } from '~/domain/photo/ReadPhotoQuery';

import { PhotoController } from './endpoints/photo.controller';
import { SharpPhotoProcessor } from './SharpPhotoProcessor';
import { DatabasePhotoStore } from './store/DatabasePhotoStore';

// Parts' photos: where they are kept, how a picture becomes one, and serving
// them. Adding one is a Part's use case, which the Part module holds.
@Module({
  controllers: [PhotoController],
  providers: [
    { provide: PhotoStore, useClass: DatabasePhotoStore },
    { provide: PhotoProcessor, useClass: SharpPhotoProcessor },
    ReadPhotoQuery,
  ],
  exports: [PhotoStore, PhotoProcessor],
})
export class PhotoModule {}
