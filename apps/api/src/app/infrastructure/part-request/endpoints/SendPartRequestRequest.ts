import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@pcp/core';
import { IsString, ValidateIf } from 'class-validator';

import { Category } from '~/domain/part/Category';
import {
  longestPartRequestName,
  longestPartRequestPartNumber,
  UncheckedPartRequestDetails,
} from '~/domain/part-request/PartRequestDetails';
import { SendPartRequestCommandInput } from '~/domain/part-request/SendPartRequestCommand';
import { OfferDetailsRequest } from '~/infrastructure/offer/endpoints/OfferDetailsRequest';

// Whether a detail was given at all. Null is taken as not given.
const given = (_request: object, value: unknown) => value != null;

// A Part Request: the Part's Category, name and manufacturer part number,
// and the Offer the Vendor would make, its details as an Offer takes them.
// No manufacturer and no specification, which are the Admin's to give, so
// either sent is refused as a field the request does not take.
//
// Each detail is checked here only for its kind of JSON value. What it holds
// is checked by the use case, which names the first detail that does not
// fit, in the form's order, with its reason.
export class SendPartRequestRequest extends OfferDetailsRequest {
  @ApiProperty({
    description: "The Part's Category, as the Vendor thinks it is.",
    enum: Category.keys(),
    example: 'gpu',
    type: String,
  })
  @ValidateIf(given)
  @IsString()
  readonly category: string | null = null;

  @ApiProperty({
    description: "The Part's name, kept as the Vendor writes it.",
    example: 'Sapphire Pulse Radeon RX 9070 XT 16GB',
    type: String,
    maxLength: longestPartRequestName,
  })
  @ValidateIf(given)
  @IsString()
  readonly name: string | null = null;

  @ApiProperty({
    description:
      "The manufacturer's part number, kept without invisible marks and without the space around it, as the catalog keeps one.",
    example: '11348-03-20G',
    type: String,
    maxLength: longestPartRequestPartNumber,
  })
  @ValidateIf(given)
  @IsString()
  readonly partNumber: string | null = null;

  toCommandInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): SendPartRequestCommandInput {
    return new SendPartRequestCommandInput(
      callerId,
      callerRoles,
      vendorId,
      new UncheckedPartRequestDetails(
        this.category,
        this.name,
        this.partNumber,
        this.uncheckedDetails(),
      ),
    );
  }
}
