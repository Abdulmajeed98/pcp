import { ApiProperty } from '@nestjs/swagger';

import { BuildPart } from '~/domain/build/Build';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

import { BuildLowestPriceResponse } from './BuildLowestPriceResponse';

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

  @ApiProperty({
    description:
      'Whether it is an Unstocked Part: no Vendor has it in stock among its Visible Offers, whether or not it is still a Visible Part (BLD-9). It stays in the Build, has no Lowest Price and is left out of every total.',
  })
  readonly unstocked: boolean;

  @ApiProperty({
    description:
      'Whether some Vendor has it in stock but its price could not be shown: the first of its in-stock Visible Offers has no Shown Price, which happens only before the first Platform Rate, with an Offer quoted only in the other currency. It then has no Lowest Price, and is left out of the total across Vendors.',
  })
  readonly priceNotShown: boolean;

  @ApiProperty({
    description:
      'Its Lowest Price in the chosen currency, times its quantity, with the Vendor it comes from, which the total across Vendors adds up (BLD-7). Null for an Unstocked Part, and for a Part whose price could not be shown.',
    type: BuildLowestPriceResponse,
    nullable: true,
  })
  readonly lowestPrice: BuildLowestPriceResponse | null;

  private constructor(part: BuildPart) {
    super(part.getPart());
    this.quantity = part.getQuantity() ?? null;
    this.visible = part.isVisible();
    this.unstocked = part.isUnstocked();
    this.priceNotShown = part.isPriceNotShown();
    this.lowestPrice = BuildLowestPriceResponse.of(
      part.getLowestPrice(),
      part.getLowestPriceTimesQuantity(),
    );
  }

  static ofBuildPart(part: BuildPart): BuildPartResponse {
    return new BuildPartResponse(part);
  }
}
