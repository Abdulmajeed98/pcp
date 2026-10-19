import { ApiProperty } from '@nestjs/swagger';

import { VisibleOffer } from '~/domain/offer/VisibleOffer';

import { usdPriceTextOf } from './OfferResponse';

// The Vendor of a visible Offer, as far as a Shopper may know it here.
export class VisibleOfferVendorResponse {
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

  private constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  static of(id: string, name: string): VisibleOfferVendorResponse {
    return new VisibleOfferVendorResponse(id, name);
  }
}

// One of a Part's visible Offers, as Shoppers see it: both Quoted Prices as
// the Vendor entered them, so that `pricing` adds Converted Prices without
// changing what is stored, and how many days ago it was confirmed, so that
// every frontend counts days the same way (OFF-7).
export class VisibleOfferResponse {
  @ApiProperty({ description: 'The Vendor.', type: VisibleOfferVendorResponse })
  readonly vendor: VisibleOfferVendorResponse;

  @ApiProperty({
    description:
      'The Quoted Price in USD, as a decimal number with two decimal places, or null when the Vendor quotes none.',
    type: String,
    nullable: true,
    example: '349.99',
  })
  readonly usdPrice: string | null;

  @ApiProperty({
    description:
      'The Quoted Price in IQD, in whole dinars, or null when the Vendor quotes none.',
    type: Number,
    nullable: true,
    example: 525000,
  })
  readonly iqdPrice: number | null;

  @ApiProperty({ description: 'Whether the Vendor has the Part in stock.' })
  readonly inStock: boolean;

  @ApiProperty({
    description: 'The warranty, in whole months, or null when the Vendor states none.',
    type: Number,
    nullable: true,
    example: 12,
  })
  readonly warrantyMonths: number | null;

  @ApiProperty({
    description: 'When the Vendor last confirmed the Offer.',
    format: 'date-time',
  })
  readonly confirmedAt: string;

  @ApiProperty({
    description:
      'The whole days of 24 hours since the last Confirmation, rounded down: 0 on the day it was confirmed.',
    example: 3,
  })
  readonly daysSinceConfirmation: number;

  private constructor(visible: VisibleOffer, now: Date) {
    const offer = visible.getOffer();
    this.vendor = VisibleOfferVendorResponse.of(
      offer.getVendorId(),
      visible.getVendorName(),
    );
    this.usdPrice = usdPriceTextOf(offer.getUsdPriceCents());
    this.iqdPrice = offer.getIqdPrice();
    this.inStock = offer.isInStock();
    this.warrantyMonths = offer.getWarrantyMonths();
    this.confirmedAt = offer.getConfirmedAt().toISOString();
    this.daysSinceConfirmation = offer.getDaysSinceConfirmation(now);
  }

  static at(now: Date): (visible: VisibleOffer) => VisibleOfferResponse {
    return (visible) => new VisibleOfferResponse(visible, now);
  }
}
