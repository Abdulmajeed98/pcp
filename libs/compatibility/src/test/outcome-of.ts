import { type Build, judgeBuild, type RuleOutcome } from '../index';

// The outcome a Build gets for one rule, or none when the rule does not apply
// to it, for a test of a rule that shares its Parts with others: a
// motherboard and RAM bring rules 4, 5 and 6 together.
export function outcomeOf(rule: number, build: Build): RuleOutcome | undefined {
  return judgeBuild(build).find((outcome) => outcome.rule === rule);
}
