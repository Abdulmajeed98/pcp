import { Module } from '@nestjs/common';

import { CreatePartCommand } from '~/domain/part/CreatePartCommand';
import { EditPartCommand } from '~/domain/part/EditPartCommand';
import { ListPartsMissingSpecificationsQuery } from '~/domain/part/ListPartsMissingSpecificationsQuery';
import { PartStore } from '~/domain/part/PartStore';
import { ReadPartQuery } from '~/domain/part/ReadPartQuery';
import { SearchPartsQuery } from '~/domain/part/SearchPartsQuery';
import { AddPartPhotoCommand } from '~/domain/part/AddPartPhotoCommand';
import { PhotoModule } from '~/infrastructure/photo/photo.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { PartController } from './endpoints/part.controller';
import { DatabasePartStore } from './store/DatabasePartStore';

@Module({
  // The rule for which Vendor a request acts for, by which a search names a
  // Vendor's Offers.
  imports: [PhotoModule, VendorModule],
  controllers: [PartController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: PartStore, useClass: DatabasePartStore },
    CreatePartCommand,
    EditPartCommand,
    ReadPartQuery,
    SearchPartsQuery,
    AddPartPhotoCommand,
    ListPartsMissingSpecificationsQuery,
  ],
  // For the modules that refer to Parts, such as Offers.
  exports: [PartStore],
})
export class PartModule {}
