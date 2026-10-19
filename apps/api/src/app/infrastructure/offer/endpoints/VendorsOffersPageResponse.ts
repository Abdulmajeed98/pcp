import { ApiProperty } from '@nestjs/swagger';
import { PagingResponse } from '@pcp/core';

import { ListVendorsOffersQueryOutput } from '~/domain/offer/ListVendorsOffersQuery';

import { ListedOfferResponse } from './ListedOfferResponse';
import { VendorsOfferCountsResponse } from './VendorsOfferCountsResponse';

// One page of a Vendor's Offers.
export class VendorsOffersPageResponse extends PagingResponse {
  @ApiProperty({
    description:
      "The page's Offers, Expired Offers among them, oldest Confirmation first, then by Part name.",
    type: [ListedOfferResponse],
  })
  readonly content: ListedOfferResponse[];

  @ApiProperty({
    description: "The Vendor's counts of all its Offers, whatever the search.",
    type: VendorsOfferCountsResponse,
  })
  readonly counts: VendorsOfferCountsResponse;

  private constructor(output: ListVendorsOffersQueryOutput) {
    const page = output.getOffersPage();
    super(page.getPageAttributes());
    this.content = page.getOffers().map(ListedOfferResponse.at(output.getNow()));
    this.counts = VendorsOfferCountsResponse.of(page.getCounts());
  }

  static of(output: ListVendorsOffersQueryOutput): VendorsOffersPageResponse {
    return new VendorsOffersPageResponse(output);
  }
}
