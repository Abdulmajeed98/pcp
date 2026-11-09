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

// The 21 Compatibility Rules by their numbers, and the outcomes the page
// lists for each (CMP-3): a Compatibility Problem and an unchecked case for
// every rule, and a Compatibility Warning for rules 11, 15 and 20 alone, as
// the MVP spec's Compatibility Rules and the API's description say.
type RuleNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21;
type WarningRule = 11 | 15 | 20;

// How many Compatibility Rules there are, which the rules' sheet's note says.
export const rulesInAll = 21 satisfies RuleNumber;
type EveryOutcome = {
  [Rule in RuleNumber as `rule${Rule}`]: Rule extends WarningRule
    ? Found
    : Exclude<Found, 'warning'>;
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
// the answer does not hold is not named. An outcome the Shopper set does not
// word, of a rule newer than the page, is said in words of its kind, so that
// nothing the rules found is left out.
export function findingsOf(answer: Answered, language: Language): Findings {
  const t = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'BuildPage',
  });
  const held = new Map(answer.parts.map((part) => [part.id, part]));

  const worded = (outcome: Outcome & { outcome: Found }): WordedOutcome => {
    const key = `outcomes.rule${outcome.rule}.${outcome.outcome}` as WordedKey;
    const words = t.has(key)
      ? t(key, { lanes: formatNumber(16), inches: formatNumber(2.5) })
      : t(`unworded.${outcome.outcome}`);
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
    passed: answer.outcomes.filter(({ outcome }) => outcome === 'passes').length,
  };
}
