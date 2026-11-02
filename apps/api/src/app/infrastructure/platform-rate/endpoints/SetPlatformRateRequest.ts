import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

import { SetPlatformRateCommandInput } from '~/domain/platform-rate/SetPlatformRateCommand';

// A new setting of the Platform Rate.
//
// The rate is not checked here, not even for its kind of JSON value: the use
// case checks it once, and names why it was refused, a text or a fraction
// among the reasons, so that the Admin console can say so beside its field.
// Its description names no limit, so that the limits are written in the
// domain alone and not copied into the generated client.
export class SetPlatformRateRequest {
  @ApiProperty({
    description:
      "The Platform Rate, in whole dinars per dollar, as a JSON whole number within the platform's limits.",
    example: 1575,
    type: Number,
  })
  @Allow()
  readonly iqdPerUsd: unknown;

  toCommandInput(callerId: string): SetPlatformRateCommandInput {
    return new SetPlatformRateCommandInput(callerId, this.iqdPerUsd);
  }
}
