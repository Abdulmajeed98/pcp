import { ApiProperty } from '@nestjs/swagger';

import { VendorsOfferCounts } from '~/domain/offer/OfferStore';

// A Vendor's counts of all its Offers, whatever the search and the state, at
// the moment the list was read: for the banner and the tabs of the Offers
// screen, and for Expiring Offers.
export class VendorsOfferCountsResponse {
  @ApiProperty({ description: 'How many Offers the Vendor has.', example: 42 })
  readonly offers: number;

  @ApiProperty({ description: 'How many of them are Expired Offers.', example: 2 })
  readonly expired: number;

  @ApiProperty({
    description: 'How many of them are not expired and will be within 3 days.',
    example: 5,
  })
  readonly aboutToExpire: number;

  @ApiProperty({ description: 'How many of them are out of stock.', example: 3 })
  readonly outOfStock: number;

  private constructor(counts: VendorsOfferCounts) {
    this.offers = counts.getOffers();
    this.expired = counts.getExpired();
    this.aboutToExpire = counts.getAboutToExpire();
    this.outOfStock = counts.getOutOfStock();
  }

  static of(counts: VendorsOfferCounts): VendorsOfferCountsResponse {
    return new VendorsOfferCountsResponse(counts);
  }
}
