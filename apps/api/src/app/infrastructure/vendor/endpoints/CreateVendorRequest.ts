import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { City } from '~/domain/vendor/City';
import {
  longestAddress,
  longestOpeningHours,
  TypedContactDetails,
} from '~/domain/vendor/ContactDetails';
import {
  CreateVendorCommandInput,
  longestVendorName,
} from '~/domain/vendor/CreateVendorCommand';

import { MapLocationRequest } from './MapLocationRequest';

// Whether a detail was given at all. Null is taken as not given.
const given = (_request: object, value: unknown) => value != null;

// Every detail of a Vendor. Each is checked here only for its kind of JSON
// value, so that a refusal of a wrong one is the request's own, naming the
// field with no reason. What a detail holds is checked by the use case, which
// names the first detail that does not fit, with its reason, and takes a
// detail left out or null as not given.
export class CreateVendorRequest {
  @ApiProperty({
    description: "The Vendor's name, as it writes it.",
    example: 'Made-up Computer Shop',
    type: String,
    maxLength: longestVendorName,
  })
  @ValidateIf(given)
  @IsString()
  readonly name: string | null = null;

  @ApiProperty({
    description: 'The city the Vendor is in.',
    enum: City.keys(),
    example: 'erbil',
  })
  @ValidateIf(given)
  @IsString()
  readonly city: string | null = null;

  @ApiProperty({
    description: "The Vendor's address, as it writes it, on one or more lines.",
    example: 'Made-up Street, Erbil',
    type: String,
    maxLength: longestAddress,
  })
  @ValidateIf(given)
  @IsString()
  readonly address: string | null = null;

  @ApiPropertyOptional({
    description: "Where the Vendor's shop is: a latitude and a longitude, both or neither.",
    type: MapLocationRequest,
    nullable: true,
  })
  @ValidateIf(given)
  @IsObject()
  @ValidateNested()
  @Type(() => MapLocationRequest)
  readonly mapLocation: MapLocationRequest | null = null;

  @ApiProperty({
    description:
      "The Vendor's phone number: an Iraqi mobile number or landline, in any form a person types one, in Western or Arabic-Indic digits.",
    example: '066 223 4567',
    type: String,
  })
  @ValidateIf(given)
  @IsString()
  readonly phoneNumber: string | null = null;

  @ApiPropertyOptional({
    description:
      "The Vendor's WhatsApp number: an Iraqi mobile number, in any form a person types one, in Western or Arabic-Indic digits.",
    example: '0770 123 4567',
    type: String,
    nullable: true,
  })
  @ValidateIf(given)
  @IsString()
  readonly whatsAppNumber: string | null = null;

  @ApiPropertyOptional({
    description:
      "The Vendor's Instagram name, with or without an @ before it, or the address of its Instagram profile.",
    example: '@made_up.shop',
    type: String,
    nullable: true,
  })
  @ValidateIf(given)
  @IsString()
  readonly instagramName: string | null = null;

  @ApiPropertyOptional({
    description: "The Vendor's opening hours, as it writes them, on one or more lines.",
    example: 'Saturday to Thursday, 9 to 9',
    type: String,
    nullable: true,
    maxLength: longestOpeningHours,
  })
  @ValidateIf(given)
  @IsString()
  readonly openingHours: string | null = null;

  @ApiProperty({
    description:
      "The phone number the Vendor's Login will be known by and logged in with: an Iraqi mobile number, in any form a person types one, in Western or Arabic-Indic digits.",
    example: '0750 123 4567',
    type: String,
  })
  @ValidateIf(given)
  @IsString()
  readonly loginPhoneNumber: string | null = null;

  toCommandInput(): CreateVendorCommandInput {
    return new CreateVendorCommandInput(
      this.name,
      this.city,
      new TypedContactDetails(
        this.address,
        this.mapLocation?.latitude ?? null,
        this.mapLocation?.longitude ?? null,
        this.phoneNumber,
        this.whatsAppNumber,
        this.instagramName,
        this.openingHours,
      ),
      this.loginPhoneNumber,
    );
  }
}
