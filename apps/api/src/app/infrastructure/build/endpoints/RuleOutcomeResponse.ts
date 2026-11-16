import { ApiProperty } from '@nestjs/swagger';
import {
  type RuleNumber,
  ruleNumbers,
  type RuleThatCannotWarn,
  type RuleThatCanWarn,
  rulesThatCanWarn,
} from '@pcp/compatibility';

import { Outcome as JudgedOutcome } from '~/domain/build/judgment';

import { BuildMissingSpecificationResponse } from './BuildMissingSpecificationResponse';

// The rules that never give a Compatibility Warning, in rule order, from the
// compatibility library's own list.
const rulesThatCannotWarn = ruleNumbers.filter(
  (rule): rule is RuleThatCannotWarn => !isARuleThatCanWarn(rule),
);

function isARuleThatCanWarn(rule: RuleNumber): rule is RuleThatCanWarn {
  return (rulesThatCanWarn as readonly RuleNumber[]).includes(rule);
}

// The outcome of a rule that can give a Compatibility Warning, and of
// another rule, as the library types them.
type OfARuleThatCanWarn = JudgedOutcome & { readonly rule: RuleThatCanWarn };
type OfAnotherRule = JudgedOutcome & { readonly rule: RuleThatCannotWarn };

// What the outcome of every Compatibility Rule holds beside its rule's
// number and its outcome.
abstract class AnOutcomeResponse {
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

  protected constructor(outcome: JudgedOutcome) {
    this.parts = outcome.outcome === 'unchecked' ? [] : [...outcome.parts];
    this.missing =
      outcome.outcome === 'unchecked'
        ? outcome.missing.map(BuildMissingSpecificationResponse.of)
        : [];
  }
}

// The outcome of one of the Compatibility Rules that can give a
// Compatibility Warning, rules 11, 15 and 20 (CMP-3).
export class OutcomeOfARuleThatCanWarnResponse extends AnOutcomeResponse {
  @ApiProperty({
    description:
      "The rule's number, as the MVP spec numbers them: one of the rules that can give a Compatibility Warning, from the compatibility library's own list.",
    enum: rulesThatCanWarn,
    type: 'integer',
    example: 11,
  })
  readonly rule: RuleThatCanWarn;

  @ApiProperty({
    description:
      'Its outcome: `passes`; `problem`, a Compatibility Problem; `warning`, a Compatibility Warning; or `unchecked`, when a needed specification it reads is missing and could change it. An unchecked rule is never a pass.',
    enum: ['passes', 'problem', 'warning', 'unchecked'],
    example: 'warning',
  })
  readonly outcome: 'passes' | 'problem' | 'warning' | 'unchecked';

  constructor(outcome: OfARuleThatCanWarn) {
    super(outcome);
    this.rule = outcome.rule;
    this.outcome = outcome.outcome;
  }
}

// The outcome of any other Compatibility Rule, which never gives a
// Compatibility Warning.
export class OutcomeOfAnotherRuleResponse extends AnOutcomeResponse {
  @ApiProperty({
    description:
      "The rule's number, as the MVP spec numbers them: one of the rules that never give a Compatibility Warning, from the compatibility library's own list.",
    enum: rulesThatCannotWarn,
    type: 'integer',
    example: 1,
  })
  readonly rule: RuleThatCannotWarn;

  @ApiProperty({
    description:
      'Its outcome: `passes`; `problem`, a Compatibility Problem; or `unchecked`, when a needed specification it reads is missing and could change it. An unchecked rule is never a pass.',
    enum: ['passes', 'problem', 'unchecked'],
    example: 'problem',
  })
  readonly outcome: 'passes' | 'problem' | 'unchecked';

  constructor(outcome: OfAnotherRule) {
    super(outcome);
    this.rule = outcome.rule;
    this.outcome = outcome.outcome;
  }
}

// The outcome of one Compatibility Rule that applies to a Build (CMP-3), as
// its rule can have it: a Warning only of a rule that can give one, as the
// library's list of the rules says, so that a caller that words each rule's
// outcomes is told by the description which outcomes each rule can have.
export type RuleOutcomeResponse =
  | OutcomeOfARuleThatCanWarnResponse
  | OutcomeOfAnotherRuleResponse;

export function ruleOutcomeResponseOf(outcome: JudgedOutcome): RuleOutcomeResponse {
  const { rule } = outcome;
  // The library types a rule that cannot warn as never answering a Warning,
  // which a check of the rule's number alone cannot carry to its outcome.
  return isARuleThatCanWarn(rule)
    ? new OutcomeOfARuleThatCanWarnResponse({ ...outcome, rule })
    : new OutcomeOfAnotherRuleResponse({ ...outcome, rule } as OfAnotherRule);
}
