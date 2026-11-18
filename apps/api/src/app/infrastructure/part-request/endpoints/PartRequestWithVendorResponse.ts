import { ApiProperty } from '@nestjs/swagger';

import { PartRequestAndOffer, SendingVendor } from '~/domain/part-request/PartRequest';

import { PartRequestResponse } from './PartRequestResponse';

// The Vendor that sent a Part Request, as the Admin reads it.
export class SendingVendorResponse {
  @ApiProperty({
    description: "The Vendor's identifier on the platform.",
    example: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Vendor's name, as the Vendor writes it.",
    example: 'Made-up Computer Shop',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Whether the Vendor is active, or a Deactivated Vendor.',
    example: true,
  })
  readonly active: boolean;

  private constructor(vendor: SendingVendor) {
    this.id = vendor.getId();
    this.name = vendor.getName();
    this.active = vendor.isActive();
  }

  static of(vendor: SendingVendor): SendingVendorResponse {
    return new SendingVendorResponse(vendor);
  }
}

// A Part Request with the Vendor that sent it, as the Admin reads it.
export class PartRequestWithVendorResponse extends PartRequestResponse {
  @ApiProperty({ description: 'The Vendor that sent it.', type: SendingVendorResponse })
  readonly vendor: SendingVendorResponse;

  // Protected, so that a fulfilment's answer adds to it what happened to
  // the Offer.
  protected constructor(answered: PartRequestAndOffer, readAt: Date) {
    super(answered, readAt);
    this.vendor = SendingVendorResponse.of(answered.getPartRequest().getVendor());
  }

  static override of(
    answered: PartRequestAndOffer,
    readAt: Date,
  ): PartRequestWithVendorResponse {
    return new PartRequestWithVendorResponse(answered, readAt);
  }
}
