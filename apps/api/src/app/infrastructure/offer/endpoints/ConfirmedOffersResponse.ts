import { ApiProperty } from '@nestjs/swagger';

import { ConfirmAllOffersCommandOutput } from '~/domain/offer/ConfirmAllOffersCommand';

// What confirming all of a Vendor's Offers answers: how many it confirmed.
export class ConfirmedOffersResponse {
  @ApiProperty({
    description: 'How many Offers were confirmed: every Offer of the Vendor.',
    example: 42,
  })
  readonly confirmed: number;

  private constructor(output: ConfirmAllOffersCommandOutput) {
    this.confirmed = output.getConfirmed();
  }

  static of(output: ConfirmAllOffersCommandOutput): ConfirmedOffersResponse {
    return new ConfirmedOffersResponse(output);
  }
}
