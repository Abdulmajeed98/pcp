import { ApiProperty } from '@nestjs/swagger';
import { PagingRequest } from '@pcp/core';
import { IsIn } from 'class-validator';

import { type Currency, currencies } from '~/domain/currency/currency';
import { ListVisibleOffersOfVendorQueryInput } from '~/domain/offer/ListVisibleOffersOfVendorQuery';

// What a visible Vendor's list of its Offers asks for, from the address's
// query: the currency every Shown Price is in, and the page. The currency is
// required, so that no page can forget to send the Shopper's choice.
export class ListVisibleOffersOfVendorRequest extends PagingRequest {
  @ApiProperty({
    description:
      "The chosen currency, which each Offer's Shown Price is in and the Offers of each Category are ordered by.",
    enum: currencies,
    // Named, so that the generated client gives the frontends one `Currency`.
    enumName: 'Currency',
    example: 'IQD',
  })
  @IsIn(currencies)
  readonly currency!: Currency;

  toQueryInput(vendorId: string): ListVisibleOffersOfVendorQueryInput {
    return new ListVisibleOffersOfVendorQueryInput(
      vendorId,
      this.currency,
      this.toDomain(),
    );
  }
}
