import { ApiProperty } from '@nestjs/swagger';

import { VendorsOfferCounts } from '~/domain/offer/OfferStore';

// A Vendor's counts of all its Offers, whatever the search, at the moment the
// list was read: for the banner of the Offers screen, and for Expiring
// Offers.
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

  private constructor(counts: VendorsOfferCounts) {
    this.offers = counts.getOffers();
    this.expired = counts.getExpired();
    this.aboutToExpire = counts.getAboutToExpire();
  }

  static of(counts: VendorsOfferCounts): VendorsOfferCountsResponse {
    return new VendorsOfferCountsResponse(counts);
  }
}
