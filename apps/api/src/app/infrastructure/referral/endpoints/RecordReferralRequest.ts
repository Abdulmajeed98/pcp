import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { RecordReferralCommandInput } from '~/domain/referral/RecordReferralCommand';

// A Referral to record: the Vendor a Shared Build is sent to.
export class RecordReferralRequest {
  @ApiProperty({
    description:
      'The identifier of the Vendor the Shared Build is sent to: an active Vendor that gave a WhatsApp number. Refused, naming `vendorId`, with the reason `noWhatsAppNumber`, for a Vendor that gave none.',
    example: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  readonly vendorId!: string;

  toCommandInput(sharedBuildId: string): RecordReferralCommandInput {
    return new RecordReferralCommandInput(sharedBuildId, this.vendorId);
  }
}
