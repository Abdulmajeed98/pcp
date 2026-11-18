import { ApiProperty } from '@nestjs/swagger';

import { RowMatchedByYourOffer } from '~/domain/offer-sheet/OfferSheetResult';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// An applied row whose part number several Parts hold, applied to the one of
// them the Vendor offers.
export class RowMatchedByYourOfferResponse {
  @ApiProperty({
    description: "The row's number in the file, as the spreadsheet numbers it.",
    type: 'integer',
    example: 37,
  })
  readonly row: number;

  @ApiProperty({
    description:
      "The Part the row was applied to: the one the Vendor offers of the Parts that hold the row's part number.",
    type: PartSummaryResponse,
  })
  readonly part: PartSummaryResponse;

  private constructor(matched: RowMatchedByYourOffer) {
    this.row = matched.getRow();
    this.part = PartSummaryResponse.of(matched.getPart());
  }

  static of(matched: RowMatchedByYourOffer): RowMatchedByYourOfferResponse {
    return new RowMatchedByYourOfferResponse(matched);
  }
}
