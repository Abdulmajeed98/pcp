import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

import { City } from '~/domain/vendor/City';
import {
  CreateVendorCommandInput,
  longestVendorName,
} from '~/domain/vendor/CreateVendorCommand';

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
    description:
      "The phone number the Vendor's Login will be known by and logged in with: an Iraqi mobile number, in any form a person types one, in Western or Arabic-Indic digits.",
    example: '0750 123 4567',
    type: String,
  })
  @ValidateIf(given)
  @IsString()
  readonly loginPhoneNumber: string | null = null;

  toCommandInput(): CreateVendorCommandInput {
    return new CreateVendorCommandInput(this.name, this.city, this.loginPhoneNumber);
  }
}
