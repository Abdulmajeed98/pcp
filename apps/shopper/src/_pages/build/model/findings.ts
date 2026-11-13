import type { BuildResponse } from '@pcp/api-client';
import {
  formatNumber,
  type Language,
  type ShopperMessages,
  shopperMessages,
} from '@pcp/i18n';
import { createTranslator } from 'next-intl';

// What the Build page reads of the API's answer to say what the rules found.
type Answered = Pick<BuildResponse, 'parts' | 'outcomes'>;

// How many of a Build's outcomes are of each kind (CMP-3): its Compatibility
// Problems, its Compatibility Warnings, its unchecked rules and the rules
// that passed, as the slip, the status and the rules' sheet each count them.
export type OutcomeCounts = Record<BuildResponse['outcomes'][number]['outcome'], number>;

export function outcomeCountsOf(outcomes: BuildResponse['outcomes']): OutcomeCounts {
  const counts: OutcomeCounts = { passes: 0, problem: 0, warning: 0, unchecked: 0 };
  for (const { outcome } of outcomes) counts[outcome] += 1;
  return counts;
}
type Part = BuildResponse['parts'][number];
type Outcome = BuildResponse['outcomes'][number];

// What a Compatibility Rule found that the page lists (CMP-3): a Compatibility
// Problem, a Compatibility Warning, or a rule that could not be checked.
export type Found = 'problem' | 'warning' | 'unchecked';

// A Part the page names under an outcome, in English (LANG-3), linked to its
// Part page when it is a Visible Part.
export interface PartNamed {
  id: string;
  name: string;
  visible: boolean;
}

// A needed specification a Part lacks, by its English label: a field of a
// row, such as a PCIe slot's lanes, by its list's label and its own.
export interface MissingNamed {
  specification: string;
  part: PartNamed;
}

// One outcome as the page words it: its rule's sentence in the page's
// language, and the Parts it names, or for an unchecked rule the
// specifications its Parts lack.
export interface WordedOutcome {
  rule: number;
  outcome: Found;
  words: string;
  parts: PartNamed[];
  missing: MissingNamed[];
}

// What the rules found, as the Build page's rules' sheet says it.
export interface Findings {
  problems: WordedOutcome[];
  warnings: WordedOutcome[];
  unchecked: WordedOutcome[];
  passed: number;
}

// The Build's Estimated power draw as the page says it.
export type PowerDraw = { watts: string } | { missing: MissingNamed[] };

// The Estimated power draw as the page says it (CMP-5): its watts in Western
// digits with their unit, the same in every language, "435 W"; or, when a
// TDP it needs is missing, each Part that lacks it, named in English with
// the specification by its English label; or none for a Build without a CPU.
// No Shopper code adds a TDP: the watts are the API's.
export function powerDrawOf(
  answer: Pick<BuildResponse, 'parts' | 'estimatedPowerDraw'>,
): PowerDraw | undefined {
  const draw = answer.estimatedPowerDraw;
  if (draw === null) return undefined;
  if (draw.watts !== null) return { watts: `${formatNumber(draw.watts)} W` };
  return { missing: missingNamed(draw.missing, answer.parts) };
}

// A Part as the page names it.
function named(part: Part): PartNamed {
  return { id: part.id, name: part.name, visible: part.visible };
}

// Each needed specification a Part lacks, by its English label, with its
// Part, once, leaving out a Part the answer does not hold. A field of a row
// is named by its list's label and its own, "PCIe slots, Lanes", once
// however many of the rows lack it.
function missingNamed(
  missing: readonly BuildResponse['outcomes'][number]['missing'][number][],
  parts: readonly Part[],
): MissingNamed[] {
  const held = new Map(parts.map((part) => [part.id, part]));
  const all = missing.flatMap((each): MissingNamed[] => {
    const part = held.get(each.part);
    if (part === undefined) return [];
    const specification =
      each.fieldLabel === null ? each.label : `${each.label}, ${each.fieldLabel}`;
    return [{ specification, part: named(part) }];
  });
  return all.filter(
    (each, place) =>
      all.findIndex(
        (other) =>
          other.part.id === each.part.id && other.specification === each.specification,
      ) === place,
  );
}

// Every Compatibility Rule the API can answer, by its number, with the
// outcomes the page lists for it (CMP-3): a Compatibility Problem and an
// unchecked case for every rule, and a Compatibility Warning for a rule that
// can give one. The API describes them from the compatibility library's own
// list of the rules, and `api-client` is generated from that description, so
// a rule the library gains, or one that can newly warn, reaches this type.
type EveryOutcome = {
  [Answered in Outcome as `rule${Answered['rule']}`]: Exclude<
    Answered['outcome'],
    'passes'
  >;
};

// The outcomes the Shopper set words, rule by rule (`BuildPage.outcomes`).
type Worded = ShopperMessages['BuildPage']['outcomes'];
type WordedOutcomes = { [Rule in keyof Worded]: keyof Worded[Rule] };

// Every rule's every outcome has its words in the Shopper set, in all three
// languages, and no words are kept for an outcome a rule cannot have: a rule
// or an outcome left unworded fails `pnpm check`'s type check here, as a new
// filter's name does in `value-words.tsx`.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const everyOutcomeIsWorded: Same<WordedOutcomes, EveryOutcome> = true;
void everyOutcomeIsWorded;

// How many Compatibility Rules there are, which the rules' sheet's note says:
// as many as the Shopper set words, which the type check above holds to the
// rules the API answers.
export const rulesInAll = Object.keys(shopperMessages.en.BuildPage.outcomes).length;

// The numbers a rule's words name, each given to its own rule's words, written
// in Western digits by `formatNumber`: rule 8's PCIe slot of 16 lanes, which a
// GPU takes, and rule 15's drives of 2.5 inches, which a case with no bay may
// not hold, as the MVP spec's table of the rules states each rule. Neither is
// a value a Part holds, which the words never name.
const numbersNamed: Partial<Record<keyof Worded, Record<string, string>>> = {
  rule8: { lanes: formatNumber(16) },
  rule15: { inches: formatNumber(2.5) },
};

type WordedKey = {
  [Rule in keyof Worded]: `outcomes.${Rule & string}.${keyof Worded[Rule] & string}`;
}[keyof Worded];

// What the rules found in a Build, in the page's language (DESIGN.md's The
// rules' sheet and The words of an outcome): its Compatibility Problems, its
// Compatibility Warnings and its unchecked rules, each group in rule order as
// the API answers them, and how many rules passed.
//
// Each outcome is one sentence for its rule, in Categories, saying what fails
// and never the values compared, then what to do; a number in it is written
// in Western digits. A Problem or a Warning names its Parts under it, each
// once, in English, in the API's order; an unchecked rule names each
// specification its Parts lack, by its English label, with its Part. A Part
// the answer does not hold is not named. Every rule the API can answer is
// worded, as the type check above holds.
export function findingsOf(answer: Answered, language: Language): Findings {
  const t = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'BuildPage',
  });
  const held = new Map(answer.parts.map((part) => [part.id, part]));

  const worded = (outcome: Outcome & { outcome: Found }): WordedOutcome => {
    const rule = `rule${outcome.rule}` as const;
    // A key of the set, since every rule's every outcome is worded.
    const key = `outcomes.${rule}.${outcome.outcome}` as WordedKey;
    const words = t(key, numbersNamed[rule]);
    const parts = [...new Set(outcome.parts)].flatMap((id) => {
      const part = held.get(id);
      return part === undefined ? [] : [named(part)];
    });
    return {
      rule: outcome.rule,
      outcome: outcome.outcome,
      words,
      parts,
      missing: missingNamed(outcome.missing, answer.parts),
    };
  };

  const ofKind = (found: Found) =>
    answer.outcomes
      .filter(
        (outcome): outcome is Outcome & { outcome: Found } => outcome.outcome === found,
      )
      .map(worded);

  return {
    problems: ofKind('problem'),
    warnings: ofKind('warning'),
    unchecked: ofKind('unchecked'),
    passed: outcomeCountsOf(answer.outcomes).passes,
  };
}
