import { ApiProperty } from '@nestjs/swagger';

import { City } from '~/domain/vendor/City';
import { Vendor } from '~/domain/vendor/Vendor';

import { MapLocationResponse } from './MapLocationResponse';
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
    description: "The Vendor's address, as it writes it, on one or more lines.",
    example: 'Made-up Street, Erbil',
  })
  readonly address: string;

  @ApiProperty({
    description: 'Where the Vendor is, or null when it has not been given.',
    type: MapLocationResponse,
    nullable: true,
  })
  readonly mapLocation: MapLocationResponse | null;

  @ApiProperty({
    description: "The Vendor's phone number, a mobile number or a landline.",
    type: PhoneNumberResponse,
  })
  readonly phoneNumber: PhoneNumberResponse;

  @ApiProperty({
    description: "The Vendor's WhatsApp number, or null when it has none.",
    type: PhoneNumberResponse,
    nullable: true,
  })
  readonly whatsAppNumber: PhoneNumberResponse | null;

  @ApiProperty({
    description:
      "The Vendor's Instagram name, bare and in lower case, or null when it has none.",
    type: String,
    nullable: true,
    example: 'made_up.shop',
  })
  readonly instagramName: string | null;

  @ApiProperty({
    description:
      "The Vendor's opening hours, as it writes them, on one or more lines, or null when it has not given them.",
    type: String,
    nullable: true,
    example: 'Saturday to Thursday, 9 to 9',
  })
  readonly openingHours: string | null;

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
    const contactDetails = vendor.getContactDetails();
    const mapLocation = contactDetails.getMapLocation();
    const whatsAppNumber = contactDetails.getWhatsAppNumber();
    this.address = contactDetails.getAddress();
    this.mapLocation = mapLocation === null ? null : MapLocationResponse.of(mapLocation);
    this.phoneNumber = PhoneNumberResponse.of(contactDetails.getPhoneNumber());
    this.whatsAppNumber =
      whatsAppNumber === null ? null : PhoneNumberResponse.of(whatsAppNumber);
    this.instagramName = contactDetails.getInstagramName();
    this.openingHours = contactDetails.getOpeningHours();
    this.loginPhoneNumber = PhoneNumberResponse.of(vendor.getLoginPhoneNumber());
    this.active = vendor.isActive();
    this.createdAt = vendor.getCreatedAt().toISOString();
    this.updatedAt = vendor.getUpdatedAt().toISOString();
  }

  static of(vendor: Vendor): VendorResponse {
    return new VendorResponse(vendor);
  }
}
