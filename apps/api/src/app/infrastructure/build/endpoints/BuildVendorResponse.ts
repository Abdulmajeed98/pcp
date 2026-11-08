import { ApiProperty } from '@nestjs/swagger';

import { BuildVendor, PartInStock } from '~/domain/build/price-views';
import { ShownPriceResponse } from '~/infrastructure/offer/endpoints/VisibleOfferResponse';

// A Part a Vendor of the second price view has in stock, named by its
// identifier among the Build's Parts, with its Shown Price there.
export class BuildPartInStockResponse {
  @ApiProperty({
    description: "The Part's identifier, as the Build's Parts name it.",
    example: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  readonly partId: string;

  @ApiProperty({
    description:
      "The Vendor's Shown Price for one of the Part, in the chosen currency. Null only when its Offer has no Quoted Price in the chosen currency and no Platform Rate has been set: the Part is then left out of the Vendor's total.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly shownPrice: ShownPriceResponse | null;

  @ApiProperty({
    description:
      "The Shown Price times the Part's quantity, as the Vendor's total adds it up, or null with it.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly timesQuantity: ShownPriceResponse | null;

  private constructor(has: PartInStock) {
    this.partId = has.getPart().getPart().getId();
    this.shownPrice = ShownPriceResponse.of(has.getShownPrice());
    this.timesQuantity = ShownPriceResponse.of(has.getTimesQuantity());
  }

  static of(has: PartInStock): BuildPartInStockResponse {
    return new BuildPartInStockResponse(has);
  }
}

// A Vendor of the second price view (BLD-8): one with at least one of the
// Build's Parts in stock among its Visible Offers, its total for them, the
// Parts it has and the Parts it lacks.
export class BuildVendorResponse {
  @ApiProperty({
    description: "The Vendor's identifier on the platform.",
    example: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Vendor's name, as the Vendor writes it.",
    example: 'Made-up Computer Shop',
  })
  readonly name: string;

  @ApiProperty({
    description:
      "The Vendor's total: each Shown Price of the Parts it has in stock times its quantity, added up as answered, after rounding, marked converted when any of them is a Converted Price. Null when none of them has a Shown Price, which happens only when no Platform Rate has been set.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly total: ShownPriceResponse | null;

  @ApiProperty({
    description:
      "The Build's Parts the Vendor has in stock among its Visible Offers, in the order of the Build's Parts.",
    type: [BuildPartInStockResponse],
  })
  readonly partsInStock: BuildPartInStockResponse[];

  @ApiProperty({
    description:
      "The identifiers of the Build's Parts that other Vendors have in stock and this one does not, in the order of the Build's Parts. An Unstocked Part is never among them.",
    type: [String],
    example: ['3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'],
  })
  readonly partsLacked: string[];

  private constructor(vendor: BuildVendor) {
    this.id = vendor.getVendor().getId();
    this.name = vendor.getVendor().getName();
    this.total = ShownPriceResponse.of(vendor.getTotal());
    this.partsInStock = vendor.getPartsInStock().map(BuildPartInStockResponse.of);
    this.partsLacked = vendor.getPartsLacked().map((part) => part.getPart().getId());
  }

  static of(vendor: BuildVendor): BuildVendorResponse {
    return new BuildVendorResponse(vendor);
  }
}
