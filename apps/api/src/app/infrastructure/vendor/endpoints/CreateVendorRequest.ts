import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

import { City } from '~/domain/vendor/City';
import {
  CreateVendorCommandInput,
  longestVendorName,
} from '~/domain/vendor/CreateVendorCommand';

import { ContactDetailsRequest, given } from './ContactDetailsRequest';

// Every detail of a Vendor: its contact details, and its name, its city and
// its login phone number, each checked as its contact details are.
export class CreateVendorRequest extends ContactDetailsRequest {
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
      this.toUncheckedContactDetails(),
      this.loginPhoneNumber,
    );
  }
}
