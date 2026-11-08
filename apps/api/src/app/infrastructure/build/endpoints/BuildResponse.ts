import { ApiProperty } from '@nestjs/swagger';

import { Build } from '~/domain/build/Build';
import { Completeness, CpuValue, cpuValues } from '~/domain/build/complete-build';
import { PriceViews } from '~/domain/build/price-views';
import { Category } from '~/domain/part/Category';
import { ShownPriceResponse } from '~/infrastructure/offer/endpoints/VisibleOfferResponse';

import { BuildPartResponse } from './BuildPartResponse';

// A Build as it is read: its Parts as the catalog holds them, whether it is a
// Complete Build, and its price views in the chosen currency.
export class BuildResponse {
  @ApiProperty({
    description:
      "The Build's Parts that the catalog holds, in the catalog's order of Categories, and the RAM kits and drives in the order the Build gives them. A Part the catalog no longer holds is left out.",
    type: [BuildPartResponse],
  })
  readonly parts: BuildPartResponse[];

  @ApiProperty({
    description:
      'Whether it is a Complete Build: a CPU, a motherboard, at least one RAM kit, at least one drive, a case and a PSU, with a GPU unless the CPU has integrated graphics and a CPU cooler unless the CPU includes one.',
  })
  readonly complete: boolean;

  @ApiProperty({
    description:
      "The Categories it still needs, in the catalog's order: none for a Complete Build, and all eight for an empty one.",
    enum: Category.keys(),
    isArray: true,
    example: ['gpu', 'psu'],
  })
  readonly stillNeeded: string[];

  @ApiProperty({
    description:
      "The values of the Build's CPU that the rule for a Complete Build reads and the CPU does not hold: `integratedGraphics`, its Integrated graphics, and `includesCooler`, its Cooler included. A CPU that does not hold one counts as not providing it, so the GPU or the CPU cooler stays needed. None without a CPU.",
    enum: cpuValues,
    isArray: true,
    example: ['includesCooler'],
  })
  readonly cpuValuesNotKnown: CpuValue[];

  @ApiProperty({
    description:
      "The first price view's total, the Build's total across Vendors (BLD-7, PRC-5): each Part's Lowest Price times its quantity, added up as answered, after rounding, marked converted when any of them is a Converted Price. It leaves out each Part with no Lowest Price, and is null when no Part has one.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly totalAcrossVendors: ShownPriceResponse | null;

  private constructor(build: Build, completeness: Completeness, priceViews: PriceViews) {
    this.parts = build.getParts().map(BuildPartResponse.ofBuildPart);
    this.complete = completeness.isComplete();
    this.stillNeeded = completeness.getStillNeeded().map((category) => category.getKey());
    this.cpuValuesNotKnown = [...completeness.getCpuValuesNotKnown()];
    this.totalAcrossVendors = ShownPriceResponse.of(priceViews.getTotalAcrossVendors());
  }

  static of(
    build: Build,
    completeness: Completeness,
    priceViews: PriceViews,
  ): BuildResponse {
    return new BuildResponse(build, completeness, priceViews);
  }
}
