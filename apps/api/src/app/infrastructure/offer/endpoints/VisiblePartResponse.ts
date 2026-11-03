import { ApiProperty } from '@nestjs/swagger';

import { VisiblePart } from '~/domain/offer/VisiblePart';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

import { ShownPriceResponse } from './VisibleOfferResponse';

// A Visible Part as a Category's list shows it to Shoppers: the Part as the
// catalog's lists show it, with what its Visible Offers say of it.
export class VisiblePartResponse extends PartSummaryResponse {
  @ApiProperty({
    description:
      "The Lowest Price: the lowest Shown Price among the Part's in-stock Visible Offers, in the chosen currency, as the first of them a Part's page lists shows it, marked converted exactly when that Offer's is. Null when no Visible Offer is in stock, and when none in stock has a Shown Price, which happens only when no Platform Rate has been set.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly lowestPrice: ShownPriceResponse | null;

  @ApiProperty({
    description: 'How many Vendors have a Visible Offer for the Part, in stock or not.',
    example: 3,
  })
  readonly vendorCount: number;

  @ApiProperty({
    description:
      'Whether any Visible Offer for the Part is in stock. False when every Vendor has it out of stock.',
  })
  readonly inStock: boolean;

  private constructor(visible: VisiblePart) {
    super(visible.getPart());
    this.lowestPrice = ShownPriceResponse.of(visible.getLowestPrice());
    this.vendorCount = visible.getVendorCount();
    this.inStock = visible.isInStock();
  }

  static ofVisible(visible: VisiblePart): VisiblePartResponse {
    return new VisiblePartResponse(visible);
  }
}
