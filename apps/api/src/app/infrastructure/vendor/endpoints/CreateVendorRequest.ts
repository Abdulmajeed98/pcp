import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

import { City } from '~/domain/vendor/City';
import { CreateVendorCommandInput } from '~/domain/vendor/CreateVendorCommand';

// A name is kept as it was written, and has to hold more than spaces. So
// does a phone number, which the use case reads.
const notBlank = /\S/;

export class CreateVendorRequest {
  @ApiProperty({
    description: "The Vendor's name, as it writes it, of at most 100 characters.",
    example: 'Made-up Computer Shop',
  })
  @IsString()
  @Matches(notBlank)
  readonly name!: string;

  @ApiProperty({
    description: 'The city the Vendor is in.',
    enum: City.keys(),
    example: 'erbil',
  })
  @IsIn(City.keys())
  readonly city!: string;

  @ApiProperty({
    description:
      "The phone number the Vendor's Login will be known by and logged in with: an Iraqi mobile number, in any form a person types one, in Western or Arabic-Indic digits.",
    example: '0750 123 4567',
  })
  @IsString()
  @Matches(notBlank)
  readonly loginPhoneNumber!: string;

  toCommandInput(): CreateVendorCommandInput {
    return new CreateVendorCommandInput(
      this.name,
      City.withKey(this.city) as City,
      this.loginPhoneNumber,
    );
  }
}
