import { ApiProperty } from '@nestjs/swagger';

import { offerFulfilments } from '~/domain/part-request/offer-fulfilment';
import type { OfferFulfilment } from '~/domain/part-request/offer-fulfilment';
import { ReadPartRequestFulfilmentQueryOutput } from '~/domain/part-request/ReadPartRequestFulfilmentQuery';

// What fulfilling an open Part Request with a Part would do to the Vendor's
// Offer for the Part, read before it is done, so that the Admin's question
// says the one outcome and warns only when the Offer would be expired.
export class PartRequestFulfilmentResponse {
  @ApiProperty({
    description:
      "What fulfilling the request with the Part would do to the Vendor's Offer for it, by the rule a fulfilment follows: `created` when the Vendor has none; `replaced` when the Vendor's Offer was last confirmed before the request was sent; `kept` when it was confirmed at or after that moment. A fulfilment judges again, and answers what it did.",
    enum: offerFulfilments,
    example: 'replaced',
  })
  readonly offer: OfferFulfilment;

  @ApiProperty({
    description:
      "Whether the Vendor's Offer would then be an Expired Offer, by the API's clock: an Offer made or replaced is confirmed at the moment the request was sent, so it would be when that was more than 14 days ago. Always false when the Offer is kept, since a kept Offer keeps its own Confirmation.",
    example: false,
  })
  readonly offerWouldBeExpired: boolean;

  private constructor(output: ReadPartRequestFulfilmentQueryOutput) {
    this.offer = output.getOffer();
    this.offerWouldBeExpired = output.offerWouldBeExpired();
  }

  static of(output: ReadPartRequestFulfilmentQueryOutput): PartRequestFulfilmentResponse {
    return new PartRequestFulfilmentResponse(output);
  }
}
