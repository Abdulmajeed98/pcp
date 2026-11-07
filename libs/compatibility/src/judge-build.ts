import type { Build, Category, Part } from './build';
import type { RuleOutcome } from './outcome';
import { missingIn } from './rules/findings';
import { rules } from './rules/rules';
import type { Rule } from './rules/statement';

// Every Category, in the catalog's order, which an outcome names Parts in.
const categories = [
  'cpu',
  'cpuCooler',
  'motherboard',
  'ram',
  'storage',
  'gpu',
  'case',
  'psu',
] as const satisfies readonly Category[];

// The outcome of every Compatibility Rule that applies to a Build, in rule
// order.
export function judgeBuild(build: Build): RuleOutcome[] {
  return rules.filter((rule) => applies(rule, build)).map((rule) => outcomeOf(rule, build));
}

// A rule applies only when the Build holds a Part of each Category it
// involves (CMP-2).
function applies(rule: Rule, build: Build): boolean {
  return categories
    .filter((category) => category in rule.involves)
    .every((category) => heldIn(build, category).length > 0);
}

// One outcome per rule: a Problem when the values present prove one;
// otherwise unchecked when a missing value could still change the outcome,
// whether it would make a Problem or a Warning; otherwise a Warning or a
// pass, as the values say. A Problem or a Warning names the Parts whose
// values make it, and a pass every Part the rule judged. An unchecked rule
// names each missing value that could change its outcome. Parts come in the
// catalog's order of Categories, and a Build's kits and drives in their own
// order.
function outcomeOf(rule: Rule, build: Build): RuleOutcome {
  const { problem, warning } = rule.judge(build);
  const parts = partsJudged(rule, build);
  if (problem.holds === true) {
    return {
      rule: rule.number,
      outcome: 'problem',
      parts: parts.filter((part) => problem.about.has(part)),
    };
  }
  if (problem.holds === 'maybe' || warning.holds === 'maybe') {
    return {
      rule: rule.number,
      outcome: 'unchecked',
      missing: missingIn(problem, warning).sort(
        (one, other) => parts.indexOf(one.part) - parts.indexOf(other.part),
      ),
    };
  }
  if (warning.holds) {
    return {
      rule: rule.number,
      outcome: 'warning',
      parts: parts.filter((part) => warning.about.has(part)),
    };
  }
  return { rule: rule.number, outcome: 'passes', parts };
}

// The Parts a rule judges, in the catalog's order: those of the Categories it
// involves, and those it reads when the Build holds them.
function partsJudged(rule: Rule, build: Build): string[] {
  return categories
    .filter((category) => category in rule.involves || category in rule.readsWhenHeld)
    .flatMap((category) => heldIn(build, category).map((part) => part.id));
}

// The Parts a Build holds of one Category: none, one, or every kit or drive.
function heldIn(build: Build, category: Category): readonly Part<unknown>[] {
  const held: Part<unknown> | readonly Part<unknown>[] | undefined = build[category];
  if (held === undefined) return [];
  return isList(held) ? held : [held];
}

function isList(
  held: Part<unknown> | readonly Part<unknown>[],
): held is readonly Part<unknown>[] {
  return Array.isArray(held);
}
