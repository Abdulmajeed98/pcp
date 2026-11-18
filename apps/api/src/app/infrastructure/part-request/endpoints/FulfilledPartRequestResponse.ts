import { ApiProperty } from '@nestjs/swagger';

import { offerFulfilments } from '~/domain/part-request/offer-fulfilment';
import type { OfferFulfilment } from '~/domain/part-request/offer-fulfilment';
import { PartRequestAndOffer } from '~/domain/part-request/PartRequest';

import { PartRequestWithVendorResponse } from './PartRequestWithVendorResponse';

// A Part Request just fulfilled, with its Vendor, and what fulfilling it did
// to the Vendor's Offer for the Part.
export class FulfilledPartRequestResponse extends PartRequestWithVendorResponse {
  @ApiProperty({
    description:
      "What fulfilling it did to the Vendor's Offer for the Part: `created` when the Vendor had none, made with the request's details and confirmed at the moment the request was sent; `replaced` when the Vendor's Offer was confirmed before that moment, its prices, stock and warranty replaced by the request's and its Confirmation moved to that moment; `kept` when the Vendor's Offer was confirmed at or after that moment, left as it was.",
    enum: offerFulfilments,
    example: 'created',
  })
  readonly offer: OfferFulfilment;

  private constructor(answered: PartRequestAndOffer, offer: OfferFulfilment, readAt: Date) {
    super(answered, readAt);
    this.offer = offer;
  }

  static ofFulfilment(
    answered: PartRequestAndOffer,
    offer: OfferFulfilment,
    readAt: Date,
  ): FulfilledPartRequestResponse {
    return new FulfilledPartRequestResponse(answered, offer, readAt);
  }
}
