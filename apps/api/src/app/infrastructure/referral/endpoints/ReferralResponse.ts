import { ApiProperty } from '@nestjs/swagger';

import { RecordReferralCommandOutput } from '~/domain/referral/RecordReferralCommand';
import { PhoneNumberResponse } from '~/infrastructure/vendor/endpoints/PhoneNumberResponse';

// The Vendor a Referral names, as far as the Shopper app needs it to open the
// chat: its identifier, its name and its WhatsApp number.
export class ReferredVendorResponse {
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
    description: "The Vendor's WhatsApp number, which the chat is opened with.",
    type: PhoneNumberResponse,
  })
  readonly whatsAppNumber: PhoneNumberResponse;

  private constructor(output: RecordReferralCommandOutput) {
    this.id = output.getVendorId();
    this.name = output.getName();
    this.whatsAppNumber = PhoneNumberResponse.of(output.getWhatsAppNumber());
  }

  static of(output: RecordReferralCommandOutput): ReferredVendorResponse {
    return new ReferredVendorResponse(output);
  }
}

// A Referral just recorded: the Vendor it names and when.
export class ReferralResponse {
  @ApiProperty({ type: ReferredVendorResponse })
  readonly vendor: ReferredVendorResponse;

  @ApiProperty({
    description: "When the Referral was recorded, by the API's clock.",
    format: 'date-time',
  })
  readonly referredAt: string;

  private constructor(output: RecordReferralCommandOutput) {
    this.vendor = ReferredVendorResponse.of(output);
    this.referredAt = output.getReferredAt().toISOString();
  }

  static of(output: RecordReferralCommandOutput): ReferralResponse {
    return new ReferralResponse(output);
  }
}
