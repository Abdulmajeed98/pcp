import { ApiProperty } from '@nestjs/swagger';

import { Outcome as JudgedOutcome } from '~/domain/build/judgment';

import { BuildMissingSpecificationResponse } from './BuildMissingSpecificationResponse';

const outcomes = ['passes', 'problem', 'warning', 'unchecked'] as const;
type Outcome = (typeof outcomes)[number];

// The outcome of one Compatibility Rule that applies to a Build (CMP-3).
export class RuleOutcomeResponse {
  @ApiProperty({
    description: "The rule's number, from 1 to 21, as the MVP spec numbers them.",
    type: 'integer',
    example: 1,
  })
  readonly rule: number;

  @ApiProperty({
    description:
      'Its outcome: `passes`; `problem`, a Compatibility Problem; `warning`, a Compatibility Warning, which only rules 11, 15 and 20 give; or `unchecked`, when a needed specification it reads is missing and could change it. An unchecked rule is never a pass.',
    enum: outcomes,
    example: 'problem',
  })
  readonly outcome: Outcome;

  @ApiProperty({
    description:
      "The Parts it is about, by their identifiers: for a Compatibility Problem or a Warning, the Parts whose values make it, every RAM kit or drive it counts among them; for a pass, every Part the rule judged; none for an unchecked rule. In the catalog's order of Categories, and the RAM kits and drives in the Build's order.",
    type: [String],
    example: [
      '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
      '9d2b6c1e-0f3a-4b7d-8e5c-1a2b3c4d5e6f',
    ],
  })
  readonly parts: string[];

  @ApiProperty({
    description:
      "For an unchecked rule, each needed specification a Part lacks that could change its outcome, once, in the catalog's order of the Parts; none otherwise.",
    type: [BuildMissingSpecificationResponse],
  })
  readonly missing: BuildMissingSpecificationResponse[];

  private constructor(outcome: JudgedOutcome) {
    this.rule = outcome.rule;
    this.outcome = outcome.outcome;
    this.parts = outcome.outcome === 'unchecked' ? [] : [...outcome.parts];
    this.missing =
      outcome.outcome === 'unchecked'
        ? outcome.missing.map(BuildMissingSpecificationResponse.of)
        : [];
  }

  static of(outcome: JudgedOutcome): RuleOutcomeResponse {
    return new RuleOutcomeResponse(outcome);
  }
}
