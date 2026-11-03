import { ApiProperty } from '@nestjs/swagger';

import { centsInADollar } from '~/domain/currency/currency';
import { Offer } from '~/domain/offer/Offer';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// An amount in whole units of a currency, of which `unitsInOne` make one of
// it, as decimal text, so that no frontend meets a binary fraction: with as
// many decimal places as a unit needs, "349.99" for cents, and none for whole
// dinars, "1575000".
export function amountTextOf(amount: number, unitsInOne: number): string {
  if (unitsInOne === 1) return String(amount);
  const places = String(unitsInOne - 1).length;
  return `${Math.floor(amount / unitsInOne)}.${String(amount % unitsInOne).padStart(places, '0')}`;
}

// A USD price in whole cents as a decimal number with two decimal places,
// "349.99".
export function dollarsTextOf(cents: number): string {
  return amountTextOf(cents, centsInADollar);
}

// The same, or null for no price.
export function usdPriceTextOf(cents: number | null): string | null {
  return cents === null ? null : dollarsTextOf(cents);
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
