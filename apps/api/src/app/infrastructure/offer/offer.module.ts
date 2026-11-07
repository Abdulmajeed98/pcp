import { Module } from '@nestjs/common';

import { ConfirmAllOffersCommand } from '~/domain/offer/ConfirmAllOffersCommand';
import { CreateOfferCommand } from '~/domain/offer/CreateOfferCommand';
import { EditOfferCommand } from '~/domain/offer/EditOfferCommand';
import { ListVendorsOffersQuery } from '~/domain/offer/ListVendorsOffersQuery';
import { ListVendorsWithExpiringOffersQuery } from '~/domain/offer/ListVendorsWithExpiringOffersQuery';
import { ListVisibleOffersOfPartQuery } from '~/domain/offer/ListVisibleOffersOfPartQuery';
import { ListVisibleOffersOfVendorQuery } from '~/domain/offer/ListVisibleOffersOfVendorQuery';
import { ListVisiblePartsQuery } from '~/domain/offer/ListVisiblePartsQuery';
import { ReadVisiblePartsFiltersQuery } from '~/domain/offer/ReadVisiblePartsFiltersQuery';
import { OfferStore } from '~/domain/offer/OfferStore';
import { PlatformFiguresStore } from '~/domain/offer/PlatformFiguresStore';
import { ReadOfferQuery } from '~/domain/offer/ReadOfferQuery';
import { ReadPlatformFiguresQuery } from '~/domain/offer/ReadPlatformFiguresQuery';
import { ReadVisiblePartQuery } from '~/domain/offer/ReadVisiblePartQuery';
import { RemoveOfferCommand } from '~/domain/offer/RemoveOfferCommand';
import { VisiblePartStore } from '~/domain/offer/VisiblePartStore';
import { PartModule } from '~/infrastructure/part/part.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { OfferController } from './endpoints/offer.controller';
import { PartOffersController } from './endpoints/part-offers.controller';
import { PlatformFiguresController } from './endpoints/platform-figures.controller';
import { VisiblePartController } from './endpoints/visible-part.controller';
import { VisiblePartsController } from './endpoints/visible-parts.controller';
import { VisibleVendorOffersController } from './endpoints/visible-vendor-offers.controller';
import { DatabaseOfferStore } from './store/DatabaseOfferStore';
import { DatabasePlatformFiguresStore } from './store/DatabasePlatformFiguresStore';
import { DatabaseVisiblePartStore } from './store/DatabaseVisiblePartStore';

@Module({
  // The rule for which Vendor a request acts for, and the Parts offered.
  imports: [VendorModule, PartModule],
  controllers: [
    OfferController,
    PartOffersController,
    VisiblePartsController,
    // After the list of Visible Parts, whose own addresses below
    // `v1/visible-parts/` would otherwise be taken for a Part's identifier:
    // the routes are matched in the order the controllers are given.
    VisiblePartController,
    VisibleVendorOffersController,
    // The platform's figures count the visible Offers, by the rule the Offer
    // module's Stores share (`visible-offer.ts`).
    PlatformFiguresController,
  ],
  providers: [
    // Each abstract class is the token the domain asks for.
    { provide: OfferStore, useClass: DatabaseOfferStore },
    { provide: VisiblePartStore, useClass: DatabaseVisiblePartStore },
    { provide: PlatformFiguresStore, useClass: DatabasePlatformFiguresStore },
    CreateOfferCommand,
    ReadOfferQuery,
    ListVendorsOffersQuery,
    ConfirmAllOffersCommand,
    ListVendorsWithExpiringOffersQuery,
    ListVisibleOffersOfPartQuery,
    ListVisiblePartsQuery,
    ReadVisiblePartsFiltersQuery,
    EditOfferCommand,
    RemoveOfferCommand,
    ReadVisiblePartQuery,
    ListVisibleOffersOfVendorQuery,
    ReadPlatformFiguresQuery,
  ],
})
export class OfferModule {}
