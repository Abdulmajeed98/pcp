import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { theDayOf } from '../the-platforms-day';
import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { offerSheetLanguage, OfferSheetLayout } from './offer-sheet-layout';
import { OfferSheetFile, OfferSheetWritten } from './OfferSheetFile';
import { OfferSheetStore } from './OfferSheetStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly language: string | null,
  ) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }

  getCallerRoles(): readonly Role[] {
    return this.callerRoles;
  }

  getVendorId(): string {
    return this.vendorId;
  }

  // The language asked for, as it was asked: not yet known to be one of the
  // three.
  getLanguage(): string | null {
    return this.language;
  }
}

class Output {
  constructor(
    private readonly fileName: string,
    private readonly fileNameInEnglish: string,
    private readonly file: Uint8Array,
  ) {}

  // The file's name, in the language asked for, with the day it was made.
  getFileName(): string {
    return this.fileName;
  }

  // The same name in English, for a program that reads only a name written
  // in plain ASCII.
  getFileNameInEnglish(): string {
    return this.fileNameInEnglish;
  }

  // The .xlsx file's bytes.
  getFile(): Uint8Array {
    return this.file;
  }
}

export { Input as DownloadOfferSheetQueryInput };
export { Output as DownloadOfferSheetQueryOutput };

// A Vendor downloads its Offer sheet, in the language it asks for: an .xlsx
// file with one row for each of its Offers, Expired Offers among them
// (SHT-1); or the Admin downloads any Vendor's, by the rule for which Vendor
// a request acts for (ACC-6). The file is made now and never kept.
@Injectable()
export class DownloadOfferSheetQuery {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly offerSheetStore: OfferSheetStore,
    private readonly offerSheetFile: OfferSheetFile,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Who may act comes first, so that a Vendor learns nothing about another
    // Vendor from the refusal of a language.
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    const language = offerSheetLanguage(input.getLanguage());
    if (Either.isLeft(language)) return Either.left(language.left);
    const layout = OfferSheetLayout.in(language.right);

    // The API's clock gives the day the file is named with, so that a test
    // moves it by moving the API's clock.
    const now = new Date();
    const contents = await this.offerSheetStore.readOffersOf(actedFor.right.getId());
    if (Either.isLeft(contents)) return Either.left(contents.left);

    const file = await this.offerSheetFile.write(
      OfferSheetWritten.of(layout, contents.right),
    );
    const day = theDayOf(now);
    return Either.map(
      file,
      (bytes) =>
        new Output(layout.fileName(day), OfferSheetLayout.in('en').fileName(day), bytes),
    );
  }
}
