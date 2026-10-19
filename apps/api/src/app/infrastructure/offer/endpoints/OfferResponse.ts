import { ApiProperty } from '@nestjs/swagger';

import { Offer } from '~/domain/offer/Offer';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// A USD price in whole cents as a decimal number with two decimal places,
// "349.99", so that no frontend meets a binary fraction.
export function usdPriceTextOf(cents: number | null): string | null {
  if (cents === null) return null;

  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

// One of a Vendor's Offers, with its Part.
export class OfferResponse {
  @ApiProperty({
    description: "The Offer's identifier on the platform.",
    example: '8e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b',
  })
  readonly id: string;

  @ApiProperty({ description: 'The Part offered.', type: PartSummaryResponse })
  readonly part: PartSummaryResponse;

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

  @ApiProperty({ description: 'When the Offer was added.', format: 'date-time' })
  readonly createdAt: string;

  protected constructor(offer: Offer) {
    this.id = offer.getId();
    this.part = PartSummaryResponse.of(offer.getPart());
    this.usdPrice = usdPriceTextOf(offer.getUsdPriceCents());
    this.iqdPrice = offer.getIqdPrice();
    this.inStock = offer.isInStock();
    this.warrantyMonths = offer.getWarrantyMonths();
    this.confirmedAt = offer.getConfirmedAt().toISOString();
    this.createdAt = offer.getCreatedAt().toISOString();
  }

  static of(offer: Offer): OfferResponse {
    return new OfferResponse(offer);
  }
}
