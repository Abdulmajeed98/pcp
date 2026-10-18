import { ApiProperty } from '@nestjs/swagger';

import { Vendor } from '~/domain/vendor/Vendor';

import { PhoneNumberResponse } from './PhoneNumberResponse';

// A Vendor as the list of Vendors shows it.
export class VendorSummaryResponse {
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
    description: "The phone number the Vendor's Login is known by and logged in with.",
    type: PhoneNumberResponse,
  })
  readonly loginPhoneNumber: PhoneNumberResponse;

  @ApiProperty({
    description: 'Whether the Vendor is active, or a deactivated Vendor.',
    example: true,
  })
  readonly active: boolean;

  private constructor(vendor: Vendor) {
    this.id = vendor.getId();
    this.name = vendor.getName();
    this.loginPhoneNumber = PhoneNumberResponse.of(vendor.getLoginPhoneNumber());
    this.active = vendor.isActive();
  }

  static of(vendor: Vendor): VendorSummaryResponse {
    return new VendorSummaryResponse(vendor);
  }
}
