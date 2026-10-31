import { ApiProperty } from '@nestjs/swagger';

import { VendorsOfferCounts } from '~/domain/offer/OfferStore';

import { OfferCountsResponse } from './OfferCountsResponse';

// A Vendor's counts of all its Offers, whatever the search and the state, at
// the moment the list was read, and how many are out of stock: for the banner
// and the tabs of the Offers screen.
export class VendorsOfferCountsResponse extends OfferCountsResponse {
  @ApiProperty({ description: 'How many of them are out of stock.', example: 3 })
  readonly outOfStock: number;

  private constructor(counts: VendorsOfferCounts) {
    super(counts);
    this.outOfStock = counts.getOutOfStock();
  }

  static override of(counts: VendorsOfferCounts): VendorsOfferCountsResponse {
    return new VendorsOfferCountsResponse(counts);
  }
}
