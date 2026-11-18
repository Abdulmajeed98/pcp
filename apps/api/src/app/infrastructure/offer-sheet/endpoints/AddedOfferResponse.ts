import { ApiProperty } from '@nestjs/swagger';

import { AddedOffer } from '~/domain/offer-sheet/OfferSheetResult';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// An Offer an upload's row added, with its Part.
export class AddedOfferResponse {
  @ApiProperty({
    description: "The row's number in the file, as the spreadsheet numbers it.",
    type: 'integer',
    example: 14,
  })
  readonly row: number;

  @ApiProperty({
    description: 'The Part the row matched, as the catalog holds it.',
    type: PartSummaryResponse,
  })
  readonly part: PartSummaryResponse;

  @ApiProperty({
    description: 'The identifier of the Offer the row added.',
    example: '8e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b',
  })
  readonly offerId: string;

  private constructor(added: AddedOffer) {
    this.row = added.getRow();
    this.part = PartSummaryResponse.of(added.getPart());
    this.offerId = added.getOfferId();
  }

  static of(added: AddedOffer): AddedOfferResponse {
    return new AddedOfferResponse(added);
  }
}
