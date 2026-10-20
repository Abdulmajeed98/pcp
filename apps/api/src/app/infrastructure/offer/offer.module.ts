import { Module } from '@nestjs/common';

import { ConfirmAllOffersCommand } from '~/domain/offer/ConfirmAllOffersCommand';
import { CreateOfferCommand } from '~/domain/offer/CreateOfferCommand';
import { EditOfferCommand } from '~/domain/offer/EditOfferCommand';
import { ListVendorsOffersQuery } from '~/domain/offer/ListVendorsOffersQuery';
import { ListVendorsWithExpiringOffersQuery } from '~/domain/offer/ListVendorsWithExpiringOffersQuery';
import { ListVisibleOffersOfPartQuery } from '~/domain/offer/ListVisibleOffersOfPartQuery';
import { OfferStore } from '~/domain/offer/OfferStore';
import { ReadOfferQuery } from '~/domain/offer/ReadOfferQuery';
import { RemoveOfferCommand } from '~/domain/offer/RemoveOfferCommand';
import { PartModule } from '~/infrastructure/part/part.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { OfferController } from './endpoints/offer.controller';
import { PartOffersController } from './endpoints/part-offers.controller';
import { DatabaseOfferStore } from './store/DatabaseOfferStore';

@Module({
  // The rule for which Vendor a request acts for, and the Parts offered.
  imports: [VendorModule, PartModule],
  controllers: [OfferController, PartOffersController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: OfferStore, useClass: DatabaseOfferStore },
    CreateOfferCommand,
    ReadOfferQuery,
    ListVendorsOffersQuery,
    ConfirmAllOffersCommand,
    ListVendorsWithExpiringOffersQuery,
    ListVisibleOffersOfPartQuery,
    EditOfferCommand,
    RemoveOfferCommand,
  ],
})
export class OfferModule {}
