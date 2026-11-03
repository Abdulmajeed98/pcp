import { ApiProperty } from '@nestjs/swagger';

import { Vendor } from '~/domain/vendor/Vendor';

import { PhoneNumberResponse } from './PhoneNumberResponse';
import { VisibleVendorResponse } from './VisibleVendorResponse';

// A Vendor as the Admin and the Vendor's own Login read it: what Shoppers see
// of it, and its Login's phone number, whether it is active, and when it was
// made and last changed.
export class VendorResponse extends VisibleVendorResponse {
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
    super(vendor);
    this.loginPhoneNumber = PhoneNumberResponse.of(vendor.getLoginPhoneNumber());
    this.active = vendor.isActive();
    this.createdAt = vendor.getCreatedAt().toISOString();
    this.updatedAt = vendor.getUpdatedAt().toISOString();
  }

  static override of(vendor: Vendor): VendorResponse {
    return new VendorResponse(vendor);
  }
}
