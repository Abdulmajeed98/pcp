import { Module } from '@nestjs/common';

import { CreateOfferCommand } from '~/domain/offer/CreateOfferCommand';
import { OfferStore } from '~/domain/offer/OfferStore';
import { ReadOfferQuery } from '~/domain/offer/ReadOfferQuery';
import { PartModule } from '~/infrastructure/part/part.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { OfferController } from './endpoints/offer.controller';
import { DatabaseOfferStore } from './store/DatabaseOfferStore';

@Module({
  // The rule for which Vendor a request acts for, and the Parts offered.
  imports: [VendorModule, PartModule],
  controllers: [OfferController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: OfferStore, useClass: DatabaseOfferStore },
    CreateOfferCommand,
    ReadOfferQuery,
  ],
})
export class OfferModule {}
