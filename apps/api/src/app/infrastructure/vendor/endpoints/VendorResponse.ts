import { ApiProperty } from '@nestjs/swagger';

import { City } from '~/domain/vendor/City';
import { Vendor } from '~/domain/vendor/Vendor';

import { PhoneNumberResponse } from './PhoneNumberResponse';

export class VendorResponse {
  @ApiProperty({
    description: "The Vendor's identifier on the platform.",
    example: '5c2a9e1f-7d3b-4e8a-9f60-1b2c3d4e5f6a',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Vendor's name, as it writes it.",
    example: 'Made-up Computer Shop',
  })
  readonly name: string;

  @ApiProperty({
    description: 'The city the Vendor is in.',
    enum: City.keys(),
    example: 'erbil',
  })
  readonly city: string;

  @ApiProperty({
    description: "The phone number the Vendor's Login is known by and logged in with.",
    type: PhoneNumberResponse,
  })
  readonly loginPhoneNumber: PhoneNumberResponse;

  @ApiProperty({
    description: 'Whether the Vendor is active, or a deactivated Vendor.',
    example: true,
  })
  readonly active: boolean;

  @ApiProperty({ description: 'When the Vendor was created.', format: 'date-time' })
  readonly createdAt: string;

  @ApiProperty({ description: 'When the Vendor last changed.', format: 'date-time' })
  readonly updatedAt: string;

  private constructor(vendor: Vendor) {
    this.id = vendor.getId();
    this.name = vendor.getName();
    this.city = vendor.getCity().getKey();
    this.loginPhoneNumber = PhoneNumberResponse.of(vendor.getLoginPhoneNumber());
    this.active = vendor.isActive();
    this.createdAt = vendor.getCreatedAt().toISOString();
    this.updatedAt = vendor.getUpdatedAt().toISOString();
  }

  static of(vendor: Vendor): VendorResponse {
    return new VendorResponse(vendor);
  }
}
