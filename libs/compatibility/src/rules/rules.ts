import { rule1 } from './rule-01';
import { rule2 } from './rule-02';
import { rule3 } from './rule-03';
import { rule4 } from './rule-04';
import { rule5 } from './rule-05';
import { rule6 } from './rule-06';
import { rule7 } from './rule-07';
import { rule8 } from './rule-08';
import { rule9 } from './rule-09';
import { rule10 } from './rule-10';
import { rule11 } from './rule-11';
import { rule12 } from './rule-12';
import { rule13 } from './rule-13';
import { rule14 } from './rule-14';
import { rule15 } from './rule-15';
import { rule16 } from './rule-16';
import { rule17 } from './rule-17';
import { rule18 } from './rule-18';
import { rule19 } from './rule-19';
import { rule20 } from './rule-20';
import { rule21 } from './rule-21';
import type { Rule } from './statement';

// Every Compatibility Rule, in rule order (CMP-1), each typed by its number
// and whether it can give a Compatibility Warning, as it is stated.
export const rules = [
  rule1,
  rule2,
  rule3,
  rule4,
  rule5,
  rule6,
  rule7,
  rule8,
  rule9,
  rule10,
  rule11,
  rule12,
  rule13,
  rule14,
  rule15,
  rule16,
  rule17,
  rule18,
  rule19,
  rule20,
  rule21,
] as const satisfies readonly Rule[];

// A Compatibility Rule, as the list holds it.
export type StatedRule = (typeof rules)[number];

// A Compatibility Rule's number: 1 to 21 (CMP-1), from the list itself.
export type RuleNumber = StatedRule['number'];

// The number of a rule that can give a Compatibility Warning: 11, 15 and 20
// (CMP-3), from the list itself.
export type RuleThatCanWarn = Extract<StatedRule, { readonly canWarn: true }>['number'];

// The number of any other rule, which never gives one.
export type RuleThatCannotWarn = Exclude<RuleNumber, RuleThatCanWarn>;

// Whether a rule can give a Compatibility Warning.
export function canWarn(
  stated: StatedRule,
): stated is Extract<StatedRule, { readonly canWarn: true }> {
  return stated.canWarn;
}

// Every rule's number, in rule order, which the API describes to its
// callers, so that one that words each rule's outcomes is told of a rule the
// list gains.
export const ruleNumbers: readonly RuleNumber[] = rules.map((stated) => stated.number);

// The numbers of the rules that can give a Compatibility Warning, in rule
// order.
export const rulesThatCanWarn: readonly RuleThatCanWarn[] = rules
  .filter(canWarn)
  .map((stated) => stated.number);
