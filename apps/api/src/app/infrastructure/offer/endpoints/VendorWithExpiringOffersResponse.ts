import { ApiProperty } from '@nestjs/swagger';

import { VendorWithExpiringOffers } from '~/domain/offer/VendorWithExpiringOffers';
import { PhoneNumberResponse } from '~/infrastructure/vendor/endpoints/PhoneNumberResponse';

import { VendorsOfferCountsResponse } from './VendorsOfferCountsResponse';

// A Vendor as the Admin's list of whom to remind shows it.
export class VendorWithExpiringOffersResponse {
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
    description: "The Vendor's phone number, a mobile number or a landline, to call.",
    type: PhoneNumberResponse,
  })
  readonly phoneNumber: PhoneNumberResponse;

  @ApiProperty({
    description:
      "The Vendor's WhatsApp number, to open a chat with, or null when it has none.",
    type: PhoneNumberResponse,
    nullable: true,
  })
  readonly whatsAppNumber: PhoneNumberResponse | null;

  @ApiProperty({
    description: "The Vendor's counts of all its Offers, at the moment the list was read.",
    type: VendorsOfferCountsResponse,
  })
  readonly counts: VendorsOfferCountsResponse;

  private constructor(vendor: VendorWithExpiringOffers) {
    const whatsAppNumber = vendor.getWhatsAppNumber();
    this.id = vendor.getId();
    this.name = vendor.getName();
    this.phoneNumber = PhoneNumberResponse.of(vendor.getPhoneNumber());
    this.whatsAppNumber =
      whatsAppNumber === null ? null : PhoneNumberResponse.of(whatsAppNumber);
    this.counts = VendorsOfferCountsResponse.of(vendor.getCounts());
  }

  static of(vendor: VendorWithExpiringOffers): VendorWithExpiringOffersResponse {
    return new VendorWithExpiringOffersResponse(vendor);
  }
}
