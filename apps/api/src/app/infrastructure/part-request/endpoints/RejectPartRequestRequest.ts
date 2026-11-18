import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

import { RejectPartRequestCommandInput } from '~/domain/part-request/RejectPartRequestCommand';
import { longestRejectionReason } from '~/domain/part-request/rejection-reason';
import { given } from '~/infrastructure/vendor/endpoints/ContactDetailsRequest';

// The Admin's reason for rejecting a Part Request. It is checked here only
// for its kind of JSON value; the use case refuses one that is missing or
// too long, with its reason.
export class RejectPartRequestRequest {
  @ApiProperty({
    description:
      'Why the Part is not added, kept as the Admin writes it, in any language, and shown to the Vendor so.',
    example: 'This is the same Part as the Sapphire Pulse RX 9070 XT already listed.',
    type: String,
    maxLength: longestRejectionReason,
  })
  @ValidateIf(given)
  @IsString()
  readonly reason: string | null = null;

  toCommandInput(partRequestId: string): RejectPartRequestCommandInput {
    return new RejectPartRequestCommandInput(partRequestId, this.reason);
  }
}
