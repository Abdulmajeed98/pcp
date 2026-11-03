import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { VisibleOffersOfVendorPage } from '~/domain/offer/VisibleOffersOfVendorPage';

import { VisibleOfferOfVendorResponse } from './VisibleOfferOfVendorResponse';

// One page of a visible Vendor's Offers.
export class VisibleOfferOfVendorPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Offers, grouped by their Parts' Categories in the catalog's order, and within each Category in stock first, then the lowest Shown Price, with Offers that have none after the others, then the most recent Confirmation, then the Part's name.",
    type: [VisibleOfferOfVendorResponse],
  })
  readonly content: VisibleOfferOfVendorResponse[];

  private constructor(page: VisibleOffersOfVendorPage, now: Date) {
    super(page.getPageAttributes());
    this.content = page.getOffers().map(VisibleOfferOfVendorResponse.at(now));
  }

  static of(page: VisibleOffersOfVendorPage, now: Date): VisibleOfferOfVendorPageResponse {
    return new VisibleOfferOfVendorPageResponse(page, now);
  }
}
