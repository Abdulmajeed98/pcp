import { Module } from '@nestjs/common';

import { FulfilPartRequestCommand } from '~/domain/part-request/FulfilPartRequestCommand';
import { ListOpenPartRequestsQuery } from '~/domain/part-request/ListOpenPartRequestsQuery';
import { ListVendorsPartRequestsQuery } from '~/domain/part-request/ListVendorsPartRequestsQuery';
import { PartRequestStore } from '~/domain/part-request/PartRequestStore';
import { ReadPartRequestQuery } from '~/domain/part-request/ReadPartRequestQuery';
import { RejectPartRequestCommand } from '~/domain/part-request/RejectPartRequestCommand';
import { SendPartRequestCommand } from '~/domain/part-request/SendPartRequestCommand';
import { OfferModule } from '~/infrastructure/offer/offer.module';
import { PartModule } from '~/infrastructure/part/part.module';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { PartRequestController } from './endpoints/part-request.controller';
import { DatabasePartRequestStore } from './store/DatabasePartRequestStore';

@Module({
  // The rule for which Vendor a request acts for, the Part that fulfils a
  // request, and the Vendor's Offer for it.
  imports: [VendorModule, PartModule, OfferModule],
  controllers: [PartRequestController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: PartRequestStore, useClass: DatabasePartRequestStore },
    SendPartRequestCommand,
    ListVendorsPartRequestsQuery,
    ListOpenPartRequestsQuery,
    ReadPartRequestQuery,
    FulfilPartRequestCommand,
    RejectPartRequestCommand,
  ],
})
export class PartRequestModule {}
