import { ApiProperty } from '@nestjs/swagger';

import { BuildPart } from '~/domain/build/Build';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// A Part of a Build: the Part as the catalog's lists show it, with its
// quantity and whether it is a Visible Part.
export class BuildPartResponse extends PartSummaryResponse {
  @ApiProperty({
    description:
      'How many of it the Build holds, from 1 to 16, for a RAM kit or a drive; null for a Part of a Category a Build holds one of.',
    type: 'integer',
    nullable: true,
    example: 2,
  })
  readonly quantity: number | null;

  @ApiProperty({
    description:
      'Whether it is a Visible Part, a Part with at least one Visible Offer, which a Part page shows. A Part that is not stays in the Build.',
  })
  readonly visible: boolean;

  private constructor(part: BuildPart) {
    super(part.getPart());
    this.quantity = part.getQuantity() ?? null;
    this.visible = part.isVisible();
  }

  static ofBuildPart(part: BuildPart): BuildPartResponse {
    return new BuildPartResponse(part);
  }
}
