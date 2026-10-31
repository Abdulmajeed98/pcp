import { ApiProperty } from '@nestjs/swagger';

import { OfferCounts } from '~/domain/offer/OfferStore';

// A Vendor's counts of all its Offers, whatever the search and the state, at
// the moment the list was read, as the Admin's list of whom to remind shows
// them.
export class OfferCountsResponse {
  @ApiProperty({ description: 'How many Offers the Vendor has.', example: 42 })
  readonly offers: number;

  @ApiProperty({ description: 'How many of them are Expired Offers.', example: 2 })
  readonly expired: number;

  @ApiProperty({
    description: 'How many of them are not expired and will be within 3 days.',
    example: 5,
  })
  readonly aboutToExpire: number;

  protected constructor(counts: OfferCounts) {
    this.offers = counts.getOffers();
    this.expired = counts.getExpired();
    this.aboutToExpire = counts.getAboutToExpire();
  }

  static of(counts: OfferCounts): OfferCountsResponse {
    return new OfferCountsResponse(counts);
  }
}
