import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, ValidateIf } from 'class-validator';

import {
  largestIqdPrice,
  longestWarrantyMonths,
  UncheckedOfferDetails,
} from '~/domain/offer/OfferDetails';

// Whether a detail was given at all. Null is taken as not given.
const given = (_request: object, value: unknown) => value != null;

// An Offer's details, as a new Offer and a change to one both send them.
//
// Each detail is checked here only for its kind of JSON value, so that a
// refusal of a wrong one is the request's own, naming the field with no
// reason. What a detail holds is checked by the use case, which names the
// first detail that does not fit, with its reason, and takes a detail left
// out or null as not given.
export abstract class OfferDetailsRequest {
  @ApiPropertyOptional({
    description:
      'The Quoted Price in USD, as a decimal number in Western digits, with at most two decimal places, more than 0 and at most 100000.00. It or the IQD price, or both, must be given.',
    example: '349.99',
    type: String,
    nullable: true,
  })
  @ValidateIf(given)
  @IsString()
  readonly usdPrice: string | null = null;

  @ApiPropertyOptional({
    description: `The Quoted Price in IQD, in whole dinars, more than 0 and at most ${largestIqdPrice}. It or the USD price, or both, must be given.`,
    example: 525000,
    type: Number,
    nullable: true,
  })
  @ValidateIf(given)
  @IsNumber()
  readonly iqdPrice: number | null = null;

  @ApiProperty({
    description: 'Whether the Vendor has the Part in stock now.',
    example: true,
    type: Boolean,
  })
  @ValidateIf(given)
  @IsBoolean()
  readonly inStock: boolean | null = null;

  @ApiPropertyOptional({
    description: `The warranty, in whole months from 1 to ${longestWarrantyMonths}, or null when the Vendor states none.`,
    example: 12,
    type: Number,
    nullable: true,
  })
  @ValidateIf(given)
  @IsNumber()
  readonly warrantyMonths: number | null = null;

  protected uncheckedDetails(): UncheckedOfferDetails {
    return new UncheckedOfferDetails(
      this.usdPrice,
      this.iqdPrice,
      this.inStock,
      this.warrantyMonths,
    );
  }
}
