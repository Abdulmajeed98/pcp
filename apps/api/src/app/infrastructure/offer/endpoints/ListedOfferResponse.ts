import { ApiProperty } from '@nestjs/swagger';

import { Offer } from '~/domain/offer/Offer';

import { OfferResponse } from './OfferResponse';

// One of a Vendor's Offers as its list answers it: the Offer with its Part,
// and its expiry at the moment the list was read, by the API's clock, so that
// every frontend counts days the same way.
export class ListedOfferResponse extends OfferResponse {
  @ApiProperty({
    description:
      'The whole days of 24 hours since the last Confirmation, rounded down: 0 on the day it was confirmed.',
    example: 3,
  })
  readonly daysSinceConfirmation: number;

  @ApiProperty({
    description:
      'Whether the Offer is an Expired Offer: its last Confirmation is more than 14 days old, and Shoppers no longer see it.',
  })
  readonly expired: boolean;

  @ApiProperty({
    description:
      'Whether the Offer is about to expire: it is not expired, and will be within 3 days.',
  })
  readonly aboutToExpire: boolean;

  private constructor(offer: Offer, now: Date) {
    super(offer);
    this.daysSinceConfirmation = offer.getDaysSinceConfirmation(now);
    this.expired = offer.isExpired(now);
    this.aboutToExpire = offer.isAboutToExpire(now);
  }

  static at(now: Date): (offer: Offer) => ListedOfferResponse {
    return (offer) => new ListedOfferResponse(offer, now);
  }
}
