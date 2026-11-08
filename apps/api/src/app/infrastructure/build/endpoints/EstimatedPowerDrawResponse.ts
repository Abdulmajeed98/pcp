import { ApiProperty } from '@nestjs/swagger';

import { PowerDraw } from '~/domain/build/judgment';

import { BuildMissingSpecificationResponse } from './BuildMissingSpecificationResponse';

// A Build's Estimated power draw (CMP-5): what it is reckoned to draw, or
// the TDPs it lacks.
export class EstimatedPowerDrawResponse {
  @ApiProperty({
    description:
      "What the Build is reckoned to draw, in W: its CPU's TDP, plus its GPU's TDP when it has one, plus 100 W for everything else. Null when a TDP it needs is missing.",
    type: 'integer',
    nullable: true,
    example: 385,
  })
  readonly watts: number | null;

  @ApiProperty({
    description:
      "Each TDP the draw needs that its Part lacks, the CPU's before the GPU's; none when the watts are known.",
    type: [BuildMissingSpecificationResponse],
  })
  readonly missing: BuildMissingSpecificationResponse[];

  private constructor(draw: PowerDraw) {
    this.watts = draw.known ? draw.watts : null;
    this.missing = draw.known ? [] : draw.missing.map(BuildMissingSpecificationResponse.of);
  }

  static of(draw: PowerDraw): EstimatedPowerDrawResponse {
    return new EstimatedPowerDrawResponse(draw);
  }
}
