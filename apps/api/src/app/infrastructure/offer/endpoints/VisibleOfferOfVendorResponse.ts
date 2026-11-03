import { ApiProperty } from '@nestjs/swagger';

import { VisibleOffer } from '~/domain/offer/VisibleOffer';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

import { VisibleOfferDetailsResponse } from './VisibleOfferResponse';

// One of a visible Vendor's Offers, as a Vendor page lists it: its Part as
// the catalog's lists show it, and what it says as a Part's visible Offers
// answer it.
export class VisibleOfferOfVendorResponse extends VisibleOfferDetailsResponse {
  @ApiProperty({ description: 'The Part offered.', type: PartSummaryResponse })
  readonly part: PartSummaryResponse;

  private constructor(visible: VisibleOffer, now: Date) {
    super(visible, now);
    this.part = PartSummaryResponse.of(visible.getOffer().getPart());
  }

  static at(now: Date): (visible: VisibleOffer) => VisibleOfferOfVendorResponse {
    return (visible) => new VisibleOfferOfVendorResponse(visible, now);
  }
}
