import type { BuildResponse } from '@pcp/api-client';
import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { findingsOf, type Found, powerDrawOf } from '@/_pages/build';

type Answered = Pick<BuildResponse, 'parts' | 'outcomes' | 'estimatedPowerDraw'>;
type Category = BuildResponse['stillNeeded'][number];
type Outcome = BuildResponse['outcomes'][number];

const languages: Language[] = ['en', 'ckb', 'ar'];

// A made-up Part of the Build, as the API answers it, with a name of the
// catalog's kind, in English.
function aPart(
  category: Category,
  number: number,
  { visible = true }: { visible?: boolean } = {},
): BuildResponse['parts'][number] {
  return {
    id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    category,
    name: `Made-up ${category} ${number} (2x16GB) "Black"`,
    manufacturer: 'Made-up Devices',
    partNumbers: [],
    photoPath: null,
    quantity: category === 'ram' || category === 'storage' ? 1 : null,
    visible,
    unstocked: false,
    priceNotShown: false,
    lowestPrice: null,
  };
}

const cpu = aPart('cpu', 1);
const board = aPart('motherboard', 2);
const kit = aPart('ram', 3);
const otherKit = aPart('ram', 4, { visible: false });
const parts = [cpu, board, kit, otherKit];

function aBuild(outcomes: Outcome[], answered: Partial<Answered> = {}): Answered {
  return { parts, outcomes, estimatedPowerDraw: null, ...answered };
}

// An outcome as the API answers it: a Problem or a Warning naming its Parts,
// a pass naming every Part the rule judged, or an unchecked rule naming the
// needed specifications its Parts lack.
function anOutcome(rule: number, outcome: Found | 'passes'): Outcome {
  return outcome === 'unchecked'
    ? {
        rule,
        outcome,
        parts: [],
        missing: [{ part: board.id, path: 'socket', label: 'Socket', fieldLabel: null }],
      }
    : { rule, outcome, parts: [cpu.id, board.id], missing: [] };
}

// The outcomes each Compatibility Rule can have, as the MVP spec's
// Compatibility Rules list them (CMP-3): a Problem and an unchecked case for
// every rule, and a Warning for rules 11, 15 and 20 alone.
const everyOutcome: [number, Found][] = Array.from(
  { length: 21 },
  (_, place) => place + 1,
).flatMap((rule): [number, Found][] => [
  [rule, 'problem'],
  ...([11, 15, 20].includes(rule) ? [[rule, 'warning'] as [number, Found]] : []),
  [rule, 'unchecked'],
]);

// The one outcome a Build of one outcome lists, in its group.
function theOneListed(rule: number, outcome: Found, language: Language) {
  const findings = findingsOf(aBuild([anOutcome(rule, outcome)]), language);
  const group = {
    problem: 'problems',
    warning: 'warnings',
    unchecked: 'unchecked',
  } as const;
  expect(findings[group[outcome]]).toHaveLength(1);
  return findings[group[outcome]][0];
}

// The rules' sheet (DESIGN.md's The words of an outcome): each outcome is
// worded for its rule in the page's language, in Categories, saying what
// fails and what to do, with the Parts it names under it in English.
describe('what the rules found', () => {
  describe.each(languages)('in %s', (language) => {
    it.each(everyOutcome)("words rule %i's %s in words of its own", (rule, outcome) => {
      const listed = theOneListed(rule, outcome, language);

      expect(listed).toMatchObject({ rule, outcome });
      expect(listed.words).toMatch(/^[^{}<>]+$/);
      expect(listed.words).not.toContain('BuildPage');
      // Not the words of an outcome the Shopper set does not word, of a rule
      // newer than the page.
      expect(listed.words).not.toBe(theOneListed(22, outcome, language).words);
    });

    it("words no two of the rules' outcomes alike", () => {
      const words = everyOutcome.map(
        ([rule, outcome]) => theOneListed(rule, outcome, language).words,
      );

      expect(new Set(words).size).toBe(everyOutcome.length);
    });

    it.each(everyOutcome.filter(([, outcome]) => outcome !== 'unchecked'))(
      "names rule %i's %s's Parts in English, each once, in the API's order",
      (rule, outcome) => {
        const listed = findingsOf(
          aBuild([{ rule, outcome, parts: [board.id, kit.id, board.id], missing: [] }]),
          language,
        )[outcome === 'problem' ? 'problems' : 'warnings'][0];

        expect(listed.parts).toEqual([
          { id: board.id, name: board.name, visible: true },
          { id: kit.id, name: kit.name, visible: true },
        ]);
        expect(listed.missing).toEqual([]);
      },
    );

    it.each(everyOutcome.filter(([, outcome]) => outcome === 'unchecked'))(
      'names each specification rule %i lacks by its English label, with its Part',
      (rule) => {
        const listed = findingsOf(
          aBuild([
            {
              rule,
              outcome: 'unchecked',
              parts: [],
              missing: [
                { part: board.id, path: 'socket', label: 'Socket', fieldLabel: null },
                {
                  part: board.id,
                  path: 'pcie_slots.0.lanes',
                  label: 'PCIe slots',
                  fieldLabel: 'Lanes',
                },
                {
                  part: board.id,
                  path: 'pcie_slots.1.lanes',
                  label: 'PCIe slots',
                  fieldLabel: 'Lanes',
                },
                {
                  part: otherKit.id,
                  path: 'ram_type',
                  label: 'RAM type',
                  fieldLabel: null,
                },
              ],
            },
          ]),
          language,
        ).unchecked[0];

        const named = (part: typeof board) => ({
          id: part.id,
          name: part.name,
          visible: part.visible,
        });
        expect(listed.missing).toEqual([
          { specification: 'Socket', part: named(board) },
          { specification: 'PCIe slots, Lanes', part: named(board) },
          { specification: 'RAM type', part: named(otherKit) },
        ]);
        expect(listed.parts).toEqual([]);
      },
    );
  });

  it.each<[Language, number, Found, string]>([
    [
      'en',
      5,
      'problem',
      'The RAM kits have more sticks than the motherboard has slots. Remove a kit, or choose a motherboard with more slots.',
    ],
    [
      'en',
      20,
      'warning',
      "The PSU has fewer CPU power connectors than the motherboard has sockets. Many motherboards start with one; the motherboard's manual says.",
    ],
    [
      'en',
      2,
      'unchecked',
      "Whether the CPU cooler fits the CPU's socket could not be checked. Check the cooler's box before you buy.",
    ],
    [
      'ckb',
      5,
      'problem',
      'کیتەکانی ڕام دانەی زیاتریان هەیە لە شوێنەکانی مازەربۆردەکە. کیتێک لاببە، یان مازەربۆردێک بە شوێنی زیاترەوە هەڵبژێرە.',
    ],
    [
      'ckb',
      20,
      'warning',
      'پاوەر سەپلایەکە گەیەنەری وزەی پرۆسێسەری کەمترە لە سۆکێتەکانی مازەربۆردەکە. زۆربەی مازەربۆردەکان بە یەکێکیان کار دەکەن؛ ڕێنمایی مازەربۆردەکە دەیڵێت.',
    ],
    [
      'ckb',
      2,
      'unchecked',
      'نەتوانرا بپشکنرێت ئایا ساردکەرەوەکە لەگەڵ سۆکێتی پرۆسێسەرەکە دەگونجێت. پێش کڕین سەیری قوتووی ساردکەرەوەکە بکە.',
    ],
    [
      'ar',
      5,
      'problem',
      'في أطقم الذاكرة شرائح أكثر من فتحات اللوحة الأم. أزل طقمًا، أو اختر لوحة أم بفتحات أكثر.',
    ],
  ])(
    'words it in %s as DESIGN.md has it: rule %i, %s',
    (language, rule, outcome, words) => {
      expect(theOneListed(rule, outcome, language).words).toBe(words);
    },
  );

  it('writes the numbers a rule names in Western digits, in every language', () => {
    for (const language of languages) {
      expect(theOneListed(8, 'problem', language).words).toContain('16');
      expect(theOneListed(15, 'warning', language).words).toContain('2.5');
    }
  });

  it('groups the Problems, the Warnings and the unchecked rules, each in rule order, and counts the passes', () => {
    const findings = findingsOf(
      aBuild([
        anOutcome(1, 'passes'),
        anOutcome(2, 'unchecked'),
        anOutcome(4, 'problem'),
        anOutcome(5, 'passes'),
        anOutcome(11, 'warning'),
        anOutcome(13, 'problem'),
        anOutcome(17, 'unchecked'),
        anOutcome(20, 'warning'),
      ]),
      'en',
    );

    expect(findings.problems.map(({ rule }) => rule)).toEqual([4, 13]);
    expect(findings.warnings.map(({ rule }) => rule)).toEqual([11, 20]);
    expect(findings.unchecked.map(({ rule }) => rule)).toEqual([2, 17]);
    expect(findings.passed).toBe(2);
  });

  it('leaves out a Part it does not hold, as one the catalog no longer holds', () => {
    const gone = '00000000-0000-4000-8000-000000000099';
    const listed = findingsOf(
      aBuild([{ rule: 1, outcome: 'problem', parts: [gone, cpu.id], missing: [] }]),
      'en',
    ).problems[0];

    expect(listed.parts.map(({ id }) => id)).toEqual([cpu.id]);
  });
});

// The Estimated power draw (CMP-5), as the API answers it: its watts, the
// Parts whose TDP the catalog lacks, or none for a Build without a CPU.
describe('the Estimated power draw', () => {
  it('writes the watts in Western digits, grouped, with their unit', () => {
    expect(
      powerDrawOf(aBuild([], { estimatedPowerDraw: { watts: 435, missing: [] } })),
    ).toEqual({ watts: '435 W' });
    expect(
      powerDrawOf(aBuild([], { estimatedPowerDraw: { watts: 1035, missing: [] } })),
    ).toEqual({ watts: '1,035 W' });
  });

  it('names each Part whose TDP is missing, in English, by its English label', () => {
    const gpu = aPart('gpu', 5, { visible: false });
    expect(
      powerDrawOf({
        parts: [cpu, gpu],
        estimatedPowerDraw: {
          watts: null,
          missing: [
            { part: cpu.id, path: 'specifications.tdp', label: 'TDP', fieldLabel: null },
            { part: gpu.id, path: 'tdp', label: 'TDP', fieldLabel: null },
          ],
        },
      }),
    ).toEqual({
      missing: [
        { specification: 'TDP', part: { id: cpu.id, name: cpu.name, visible: true } },
        { specification: 'TDP', part: { id: gpu.id, name: gpu.name, visible: false } },
      ],
    });
  });

  it('is left out of a Build without a CPU', () => {
    expect(powerDrawOf(aBuild([]))).toBeUndefined();
  });
});
