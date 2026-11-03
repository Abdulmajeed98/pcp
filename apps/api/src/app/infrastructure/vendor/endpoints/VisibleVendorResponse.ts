import { ApiProperty } from '@nestjs/swagger';

import { City } from '~/domain/vendor/City';
import { Vendor } from '~/domain/vendor/Vendor';

import { MapLocationResponse } from './MapLocationResponse';
import { PhoneNumberResponse } from './PhoneNumberResponse';

// A Vendor as Shoppers see it, on a Vendor page: its name, its city and its
// contact details, as it writes them. It holds nothing of its Login, so that
// no login phone number can reach a Shopper, and nothing of whether it is
// active, since Shoppers see only active Vendors.
export class VisibleVendorResponse {
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

  // Protected, so that the Admin's and the Vendor's own answers add to it
  // what only they may read.
  protected constructor(vendor: Vendor) {
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
  }

  static of(vendor: Vendor): VisibleVendorResponse {
    return new VisibleVendorResponse(vendor);
  }
}
