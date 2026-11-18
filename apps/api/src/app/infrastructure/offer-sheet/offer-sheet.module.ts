import { Module } from '@nestjs/common';

import { DownloadOfferSheetQuery } from '~/domain/offer-sheet/DownloadOfferSheetQuery';
import { OfferSheetFile } from '~/domain/offer-sheet/OfferSheetFile';
import { OfferSheetStore } from '~/domain/offer-sheet/OfferSheetStore';
import { VendorModule } from '~/infrastructure/vendor/vendor.module';

import { OfferSheetController } from './endpoints/offer-sheet.controller';
import { ExcelJsOfferSheetFile } from './file/ExcelJsOfferSheetFile';
import { DatabaseOfferSheetStore } from './store/DatabaseOfferSheetStore';

@Module({
  // The rule for which Vendor a request acts for.
  imports: [VendorModule],
  controllers: [OfferSheetController],
  providers: [
    // The abstract classes are the tokens the domain asks for.
    { provide: OfferSheetStore, useClass: DatabaseOfferSheetStore },
    { provide: OfferSheetFile, useClass: ExcelJsOfferSheetFile },
    DownloadOfferSheetQuery,
  ],
})
export class OfferSheetModule {}
