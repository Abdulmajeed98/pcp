import { ApiProperty } from '@nestjs/swagger';

import { UploadOfferSheetCommandOutput } from '~/domain/offer-sheet/UploadOfferSheetCommand';

import { AddedOfferResponse } from './AddedOfferResponse';
import { RowMatchedByYourOfferResponse } from './RowMatchedByYourOfferResponse';
import { SkippedRowResponse } from './SkippedRowResponse';

// The upload's result (SHT-5): what the upload did with each row of the
// file. Every applied row is a Confirmation at the upload's moment, added,
// changed or only confirmed; every skipped row changed nothing.
export class OfferSheetResultResponse {
  @ApiProperty({
    description: 'How many rows were read, not counting empty ones.',
    type: 'integer',
    example: 312,
  })
  readonly rows: number;

  @ApiProperty({
    description: 'Each Offer the upload added, by row number.',
    type: [AddedOfferResponse],
  })
  readonly added: AddedOfferResponse[];

  @ApiProperty({
    description:
      "How many Offers the upload changed: a price, the stock or the warranty differs from the Offer's.",
    type: 'integer',
    example: 41,
  })
  readonly changed: number;

  @ApiProperty({
    description: 'How many Offers the upload confirmed without changing anything.',
    type: 'integer',
    example: 265,
  })
  readonly confirmed: number;

  @ApiProperty({
    description:
      'Each applied row whose part number several Parts hold, applied to the one of them the Vendor offers, by row number.',
    type: [RowMatchedByYourOfferResponse],
  })
  readonly matchedByYourOffer: RowMatchedByYourOfferResponse[];

  @ApiProperty({
    description: 'Every skipped row, by row number, with its problem.',
    type: [SkippedRowResponse],
  })
  readonly skipped: SkippedRowResponse[];

  private constructor(output: UploadOfferSheetCommandOutput) {
    const result = output.getResult();
    this.rows = result.getRows();
    this.added = result.getAdded().map((added) => AddedOfferResponse.of(added));
    this.changed = result.getChanged();
    this.confirmed = result.getConfirmed();
    this.matchedByYourOffer = result
      .getMatchedByYourOffer()
      .map((matched) => RowMatchedByYourOfferResponse.of(matched));
    this.skipped = result.getSkipped().map((skipped) => SkippedRowResponse.of(skipped));
  }

  static of(output: UploadOfferSheetCommandOutput): OfferSheetResultResponse {
    return new OfferSheetResultResponse(output);
  }
}
