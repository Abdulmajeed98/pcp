import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

import { Build } from '~/domain/build/Build';
import { CatalogPart } from '~/domain/build/BuildStore';
import { Completeness, CpuValue, cpuValues } from '~/domain/build/complete-build';
import { Judgment } from '~/domain/build/judgment';
import { PriceViews } from '~/domain/build/price-views';
import { Category } from '~/domain/part/Category';
import { ShownPriceResponse } from '~/infrastructure/offer/endpoints/VisibleOfferResponse';

import { BuildPartResponse } from './BuildPartResponse';
import { BuildVendorResponse } from './BuildVendorResponse';
import { EstimatedPowerDrawResponse } from './EstimatedPowerDrawResponse';
import {
  OutcomeOfAnotherRuleResponse,
  OutcomeOfARuleThatCanWarnResponse,
  type RuleOutcomeResponse,
  ruleOutcomeResponseOf,
} from './RuleOutcomeResponse';

// A Build as it is read: its Parts as the catalog holds them, whether it is a
// Complete Build, what the Compatibility Rules find in it, its Estimated
// power draw, and its price views in the chosen currency.
@ApiExtraModels(OutcomeOfARuleThatCanWarnResponse, OutcomeOfAnotherRuleResponse)
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
      "The outcome of every Compatibility Rule that applies to the Build, passes included, in rule order, each of a rule of the compatibility library's own list and as its rule can have it: a Compatibility Warning only of a rule that can give one. A rule applies only when the Build holds a Part of each Category it involves (CMP-2), so an empty Build has none. Every Part is judged, one that is no longer a Visible Part and one no Vendor has in stock among them, since each stays in the Build.",
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(OutcomeOfARuleThatCanWarnResponse) },
        { $ref: getSchemaPath(OutcomeOfAnotherRuleResponse) },
      ],
    },
  })
  readonly outcomes: RuleOutcomeResponse[];

  @ApiProperty({
    description:
      'Its Estimated power draw, as the Compatibility Rules add it up, or the TDPs it lacks; null for a Build without a CPU.',
    type: EstimatedPowerDrawResponse,
    nullable: true,
  })
  readonly estimatedPowerDraw: EstimatedPowerDrawResponse | null;

  @ApiProperty({
    description:
      "The first price view's total, the Build's total across Vendors (BLD-7, PRC-5): each Part's Lowest Price times its quantity, added up as answered, after rounding, marked converted when any of them is a Converted Price. It leaves out each Part with no Lowest Price, and is null when no Part has one.",
    type: ShownPriceResponse,
    nullable: true,
  })
  readonly totalAcrossVendors: ShownPriceResponse | null;

  @ApiProperty({
    description:
      "The second price view (BLD-8): each active Vendor with at least one of the Build's Parts in stock among its Visible Offers, with its total, the Parts it has and the Parts it lacks. They come by how many Parts they lack, fewest first, then by their total, lowest first, with none after any, then by name, then by identifier. An Unstocked Part is in no Vendor's list.",
    type: [BuildVendorResponse],
  })
  readonly vendors: BuildVendorResponse[];

  private constructor(
    build: Build<CatalogPart>,
    completeness: Completeness,
    judgment: Judgment,
    priceViews: PriceViews,
  ) {
    this.parts = build.getParts().map(BuildPartResponse.ofBuildPart);
    this.complete = completeness.isComplete();
    this.stillNeeded = completeness.getStillNeeded().map((category) => category.getKey());
    this.cpuValuesNotKnown = [...completeness.getCpuValuesNotKnown()];
    this.outcomes = judgment.getOutcomes().map(ruleOutcomeResponseOf);
    const draw = judgment.getEstimatedPowerDraw();
    this.estimatedPowerDraw =
      draw === undefined ? null : EstimatedPowerDrawResponse.of(draw);
    this.totalAcrossVendors = ShownPriceResponse.of(priceViews.getTotalAcrossVendors());
    this.vendors = priceViews.getVendors().map(BuildVendorResponse.of);
  }

  static of(
    build: Build<CatalogPart>,
    completeness: Completeness,
    judgment: Judgment,
    priceViews: PriceViews,
  ): BuildResponse {
    return new BuildResponse(build, completeness, judgment, priceViews);
  }
}
