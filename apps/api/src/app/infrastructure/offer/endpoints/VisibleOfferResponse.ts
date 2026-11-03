import { ApiProperty } from '@nestjs/swagger';

import { type Currency, currencies, currencyFacts } from '~/domain/currency/currency';
import { ShownPrice } from '~/domain/offer/shown-price';
import { VisibleOffer } from '~/domain/offer/VisibleOffer';

import { amountTextOf, usdPriceTextOf } from './OfferResponse';

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

// The price an Offer shows in the chosen currency, as the API computed it, so
// that no frontend converts a price or rounds one (PRC-3).
export class ShownPriceResponse {
  @ApiProperty({
    description: 'The chosen currency.',
    enum: currencies,
    enumName: 'Currency',
    example: 'IQD',
  })
  readonly currency: Currency;

  @ApiProperty({
    description:
      'The amount, as decimal text: in USD with two decimal places, in IQD in whole dinars. A Quoted Price is as the Vendor entered it; a Converted Price is rounded to the nearest 250 IQD or whole dollar, and is never below one step.',
    example: '551250',
  })
  readonly amount: string;

  @ApiProperty({
    description:
      'Whether it is a Converted Price, derived from the Offer\'s Quoted Price in the other currency at the current Platform Rate, which a Shopper sees marked "≈".',
    example: true,
  })
  readonly converted: boolean;

  private constructor(shown: ShownPrice) {
    this.currency = shown.getCurrency();
    this.amount = amountTextOf(
      shown.getAmount(),
      currencyFacts[shown.getCurrency()].unitsInOne,
    );
    this.converted = shown.isConverted();
  }

  static of(shown: ShownPrice | null): ShownPriceResponse | null {
    return shown === null ? null : new ShownPriceResponse(shown);
  }
}

// What a visible Offer says, as Shoppers see it, wherever it is listed: both
// Quoted Prices as the Vendor entered them, its Shown Price in the chosen
// currency, and how many days ago it was confirmed, so that every frontend
// counts days the same way (OFF-7). A Part's Offers add their Vendor, and a
// Vendor's their Part.
export class VisibleOfferDetailsResponse {
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

  @ApiProperty({
    description:
      'The price the Offer shows in the chosen currency: its Quoted Price in that currency if there is one, else its Converted Price. Null only when the Offer has no Quoted Price in the chosen currency and no Platform Rate has been set.',
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly shownPrice: ShownPriceResponse | null;

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

  protected constructor(visible: VisibleOffer, now: Date) {
    const offer = visible.getOffer();
    this.usdPrice = usdPriceTextOf(offer.getUsdPriceCents());
    this.iqdPrice = offer.getIqdPrice();
    this.shownPrice = ShownPriceResponse.of(visible.getShownPrice());
    this.inStock = offer.isInStock();
    this.warrantyMonths = offer.getWarrantyMonths();
    this.confirmedAt = offer.getConfirmedAt().toISOString();
    this.daysSinceConfirmation = offer.getDaysSinceConfirmation(now);
  }
}

// One of a Part's visible Offers, as Shoppers see it, with its Vendor.
export class VisibleOfferResponse extends VisibleOfferDetailsResponse {
  @ApiProperty({ description: 'The Vendor.', type: VisibleOfferVendorResponse })
  readonly vendor: VisibleOfferVendorResponse;

  private constructor(visible: VisibleOffer, now: Date) {
    super(visible, now);
    this.vendor = VisibleOfferVendorResponse.of(
      visible.getOffer().getVendorId(),
      visible.getVendorName(),
    );
  }

  static at(now: Date): (visible: VisibleOffer) => VisibleOfferResponse {
    return (visible) => new VisibleOfferResponse(visible, now);
  }
}
