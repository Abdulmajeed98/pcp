import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { OfferDetails } from '../offer/OfferDetails';
import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { offerSheetRefused } from './offer-sheet-errors';
import {
  isTheLayout,
  largestOfferSheetBytes,
  mostRowsOfAnOfferSheet,
} from './offer-sheet-layout';
import { matchedRows } from './offer-sheet-matching';
import { foldedPartNumber } from './offer-sheet-part-numbers';
import { checkedRow, isEmptyRow } from './offer-sheet-row';
import {
  emptyCell,
  OfferSheetFile,
  OfferSheetRead,
  OfferSheetRowRead,
} from './OfferSheetFile';
import {
  AddedOffer,
  OfferSheetResult,
  RowMatchedByYourOffer,
  SkippedRow,
} from './OfferSheetResult';
import {
  ApplyOfferSheetParams,
  OfferSheetRowToApply,
  OfferSheetStore,
} from './OfferSheetStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly file: Uint8Array | undefined,
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

  // The file's bytes, or nothing when no file was sent.
  getFile(): Uint8Array | undefined {
    return this.file;
  }
}

class Output {
  private constructor(private readonly result: OfferSheetResult) {}

  static of(result: OfferSheetResult): Output {
    return new Output(result);
  }

  getResult(): OfferSheetResult {
    return this.result;
  }
}

export { Input as UploadOfferSheetCommandInput };
export { Output as UploadOfferSheetCommandOutput };

// Whether a row changes a price, the stock or the warranty of the Offer it
// replaced: changed when it does, only confirmed when it does not.
function changes(details: OfferDetails, before: OfferDetails): boolean {
  return (
    details.changePricesOrStockOf({
      usdPriceCents: before.getUsdPriceCents(),
      iqdPrice: before.getIqdPrice(),
      inStock: before.isInStock(),
    }) || details.getWarrantyMonths() !== before.getWarrantyMonths()
  );
}

// The first worksheet's row 1, the headings, six cells, A to F.
function headingsOf(read: OfferSheetRead) {
  const [first] = read.getRows();
  return first?.getRow() === 1
    ? first.getCells()
    : Array.from({ length: 6 }, () => emptyCell);
}

// A Vendor uploads its Offer sheet to change many Offers at once, or the
// Admin uploads any Vendor's, by the rule for which Vendor a request acts
// for (ACC-6). Each row is matched to a Part by its part number (SHT-2); in
// one transaction, each matched row changes or creates the Vendor's Offer
// for that Part, a Confirmation at the upload's moment (SHT-3, OFF-5). An
// Offer no applied row names is left as it was (SHT-4). A row with a
// problem is skipped and the rest are applied, and the answer is the
// upload's result (SHT-5). A file is refused whole, with nothing applied,
// when it is not the platform's own layout (SHT-7), or cannot be taken.
@Injectable()
export class UploadOfferSheetCommand {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly offerSheetFile: OfferSheetFile,
    private readonly offerSheetStore: OfferSheetStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Who may act comes first, so that a Vendor learns nothing about another
    // Vendor from the refusal of a file.
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);
    const vendorId = actedFor.right.getId();

    const rows = await this.rowsOf(input.getFile());
    if (Either.isLeft(rows)) return Either.left(rows.left);

    const checked = rows.right.map(checkedRow);
    const valid = checked.filter(Either.isRight).map((row) => row.right);
    const notValid = checked.filter(Either.isLeft).map((row) => row.left);

    const matches = await this.offerSheetStore.readMatchesOf(vendorId, [
      ...new Set(valid.map((row) => foldedPartNumber(row.getPartNumber()))),
    ]);
    if (Either.isLeft(matches)) return Either.left(matches.left);
    const { matched, skipped } = matchedRows(valid, matches.right);

    // The API's clock, read once: every applied row's Confirmation is the
    // upload's one moment.
    const now = new Date();
    const applied = await this.offerSheetStore.apply(
      new ApplyOfferSheetParams(
        vendorId,
        matched.map(
          (each) =>
            new OfferSheetRowToApply(each.getPart().getId(), each.getRow().getDetails()),
        ),
        now,
        input.getCallerId(),
      ),
    );
    if (Either.isLeft(applied)) return Either.left(applied.left);

    const added: AddedOffer[] = [];
    let changed = 0;
    let confirmed = 0;
    matched.forEach((each, index) => {
      const done = applied.right[index];
      if (done.kind === 'added') {
        added.push(new AddedOffer(each.getRow().getRow(), each.getPart(), done.offerId));
      } else if (changes(each.getRow().getDetails(), done.before)) {
        changed += 1;
      } else {
        confirmed += 1;
      }
    });

    const byRow = (one: { getRow(): number }, other: { getRow(): number }) =>
      one.getRow() - other.getRow();
    return Either.right(
      Output.of(
        new OfferSheetResult(
          rows.right.length,
          added,
          changed,
          confirmed,
          matched
            .filter((each) => each.isByYourOffer())
            .map(
              (each) => new RowMatchedByYourOffer(each.getRow().getRow(), each.getPart()),
            ),
          [...notValid, ...skipped].sort(byRow) satisfies SkippedRow[],
        ),
      ),
    );
  }

  // The rows of the file that are not empty, below its headings, or why the
  // file is refused as a whole, in this order: none was sent; it is too
  // large, over 5 MB; it cannot be read, or what it holds unpacks past the
  // bound an upload is read within, which is too large too; its first
  // worksheet's first row is not the six headings; or it holds too many
  // rows.
  private async rowsOf(
    file: Uint8Array | undefined,
  ): Promise<Either.Either<readonly OfferSheetRowRead[], StructuredError>> {
    if (file === undefined) return Either.left(offerSheetRefused('missing'));
    if (file.length > largestOfferSheetBytes)
      return Either.left(offerSheetRefused('tooLarge'));

    const read = await this.offerSheetFile.read(file);
    if (Either.isLeft(read)) return Either.left(offerSheetRefused(read.left));
    if (!isTheLayout(headingsOf(read.right))) {
      return Either.left(offerSheetRefused('notTheLayout'));
    }

    const rows = read.right.getRows().filter((row) => row.getRow() > 1 && !isEmptyRow(row));
    if (rows.length > mostRowsOfAnOfferSheet) {
      return Either.left(offerSheetRefused('tooManyRows'));
    }
    return Either.right(rows);
  }
}
