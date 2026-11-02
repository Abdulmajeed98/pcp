import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ListVisibleOffersOfPartQueryInput } from '~/domain/offer/ListVisibleOffersOfPartQuery';
import { type Currency, currencies } from '~/domain/offer/shown-price';

// What a read of a Part's visible Offers asks for, from the address's query:
// the currency every Shown Price is in. It is required, so that no page can
// forget to send the Shopper's choice.
export class ListVisibleOffersOfPartRequest {
  @ApiProperty({
    description:
      "The chosen currency, which each Offer's Shown Price is in and the Offers are ordered by.",
    enum: currencies,
    example: 'IQD',
  })
  @IsIn(currencies)
  readonly currency!: Currency;

  toQueryInput(partId: string): ListVisibleOffersOfPartQueryInput {
    return new ListVisibleOffersOfPartQueryInput(partId, this.currency);
  }
}
