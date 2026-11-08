import { ApiProperty } from '@nestjs/swagger';

import { ShownPrice } from '~/domain/offer/shown-price';
import { LowestPrice } from '~/domain/build/in-stock-offers';
import {
  ShownPriceResponse,
  VisibleOfferVendorResponse,
} from '~/infrastructure/offer/endpoints/VisibleOfferResponse';

// A Build's Part's Lowest Price, as the first price view shows it: the
// price, the price times the Part's quantity, and the Vendor of the Offer it
// comes from, so that no frontend multiplies a price.
export class BuildLowestPriceResponse {
  @ApiProperty({
    description:
      "The Lowest Price of one of the Part: the lowest Shown Price among its in-stock Visible Offers, in the chosen currency, as the first of them a Part's page lists shows it, marked converted exactly when that Offer's is.",
    type: ShownPriceResponse,
  })
  readonly shownPrice: ShownPriceResponse;

  @ApiProperty({
    description:
      "The Lowest Price times the Part's quantity, as the total across Vendors adds it up: the same as the Lowest Price for a Part of a Category a Build holds one of.",
    type: ShownPriceResponse,
  })
  readonly timesQuantity: ShownPriceResponse;

  @ApiProperty({
    description:
      'The Vendor whose Offer the Lowest Price comes from: of equal prices, the one whose Offer the Part page lists first.',
    type: VisibleOfferVendorResponse,
  })
  readonly vendor: VisibleOfferVendorResponse;

  private constructor(lowest: LowestPrice, timesQuantity: ShownPrice) {
    this.shownPrice = ShownPriceResponse.of(lowest.getShownPrice());
    this.timesQuantity = ShownPriceResponse.of(timesQuantity);
    this.vendor = VisibleOfferVendorResponse.of(
      lowest.getVendor().getId(),
      lowest.getVendor().getName(),
    );
  }

  static of(
    lowest: LowestPrice | null,
    timesQuantity: ShownPrice | null,
  ): BuildLowestPriceResponse | null {
    return lowest === null || timesQuantity === null
      ? null
      : new BuildLowestPriceResponse(lowest, timesQuantity);
  }
}
