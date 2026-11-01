import { ApiProperty } from '@nestjs/swagger';
import { Option } from 'effect';

import { PlatformRate } from '~/domain/platform-rate/PlatformRate';

// One setting of the Platform Rate.
export class CurrentPlatformRateResponse {
  @ApiProperty({
    description: 'The Platform Rate, in whole dinars per dollar.',
    example: 1575,
  })
  readonly iqdPerUsd: number;

  @ApiProperty({ description: 'When the Admin set it.', format: 'date-time' })
  readonly setAt: string;

  private constructor(rate: PlatformRate) {
    this.iqdPerUsd = rate.getIqdPerUsd();
    this.setAt = rate.getSetAt().toISOString();
  }

  static of(rate: PlatformRate): CurrentPlatformRateResponse {
    return new CurrentPlatformRateResponse(rate);
  }
}

// The current Platform Rate, as the read and a setting both answer it.
export class PlatformRateResponse {
  @ApiProperty({
    description:
      'The current Platform Rate, the newest setting, or null until the Admin sets the first.',
    type: CurrentPlatformRateResponse,
    nullable: true,
  })
  readonly current: CurrentPlatformRateResponse | null;

  private constructor(current: CurrentPlatformRateResponse | null) {
    this.current = current;
  }

  static of(current: Option.Option<PlatformRate>): PlatformRateResponse {
    return new PlatformRateResponse(
      Option.getOrNull(Option.map(current, CurrentPlatformRateResponse.of)),
    );
  }
}
