import { ApiProperty } from '@nestjs/swagger';

import { PlatformFigures } from '~/domain/offer/PlatformFigures';

// The platform's figures, as the Shopper app's home page and a Part's price
// slip print them. The Platform Rate is its value alone: when it was set, and
// by whom, stay the Admin's, at `v1/platform-rate`.
export class PlatformFiguresResponse {
  @ApiProperty({
    description:
      'How many active Vendors the platform has, one with no Visible Offer among them. A deactivated Vendor is not counted.',
    example: 21,
  })
  readonly activeVendorCount: number;

  @ApiProperty({
    description:
      'How many Visible Offers the platform lists, in stock or not: Offers that are not Expired Offers, of active Vendors.',
    example: 852,
  })
  readonly visibleOfferCount: number;

  @ApiProperty({
    description:
      'The current Platform Rate, in whole dinars per dollar, or null until the Admin sets the first.',
    type: Number,
    nullable: true,
    example: 1575,
  })
  readonly iqdPerUsd: number | null;

  @ApiProperty({
    description:
      'How many days an Offer stays current without a Confirmation: one last confirmed longer ago is an Expired Offer, which no Shopper sees.',
    example: 14,
  })
  readonly daysAnOfferStaysCurrent: number;

  private constructor(figures: PlatformFigures) {
    this.activeVendorCount = figures.getActiveVendorCount();
    this.visibleOfferCount = figures.getVisibleOfferCount();
    this.iqdPerUsd = figures.getIqdPerUsd();
    this.daysAnOfferStaysCurrent = figures.getDaysAnOfferStaysCurrent();
  }

  static of(figures: PlatformFigures): PlatformFiguresResponse {
    return new PlatformFiguresResponse(figures);
  }
}
