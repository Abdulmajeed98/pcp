import type { BuildResponse } from '@pcp/api-client';
import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { type StatusPiece, statusOf } from '@/widgets/build-quote';

type Answered = Pick<
  BuildResponse,
  'parts' | 'complete' | 'stillNeeded' | 'cpuValuesNotKnown' | 'outcomes'
>;
type Category = BuildResponse['stillNeeded'][number];

// A made-up Part of the Build, as the API answers it, of a Category.
function aPart(category: Category, number: number): BuildResponse['parts'][number] {
  return {
    id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    category,
    name: `Made-up ${category} ${number}`,
    manufacturer: 'Made-up Devices',
    partNumbers: [],
    photoPath: null,
    quantity: category === 'ram' || category === 'storage' ? 1 : null,
    visible: true,
    unstocked: false,
    priceNotShown: false,
    lowestPrice: null,
  };
}

function aBuild(categories: Category[], answered: Partial<Answered>): Answered {
  return {
    parts: categories.map((category, place) => aPart(category, place + 1)),
    complete: false,
    stillNeeded: [],
    cpuValuesNotKnown: [],
    outcomes: [],
    ...answered,
  };
}

// A Problem the rules found, as the API answers it.
const aProblem: BuildResponse['outcomes'][number] = {
  rule: 5,
  outcome: 'problem',
  parts: [],
  missing: [],
};
const aPass: BuildResponse['outcomes'][number] = { ...aProblem, outcome: 'passes' };

// The sentence as a Shopper reads it, each Category needed among its words.
function read(pieces: readonly StatusPiece[]): string {
  return pieces.map((piece) => (typeof piece === 'string' ? piece : piece.words)).join('');
}

// The Build page's status, under its title (DESIGN.md's The status): a
// Complete Build, the Categories it still needs, each a link to its picker,
// or that no Part is chosen yet; and under it a line for each value of the
// CPU that the rule for a Complete Build read.
describe("the Build page's status", () => {
  const empty = aBuild([], {
    stillNeeded: [
      'cpu',
      'cpuCooler',
      'motherboard',
      'ram',
      'storage',
      'gpu',
      'case',
      'psu',
    ],
  });

  it.each<[Language, string]>([
    ['en', 'No Part chosen yet. Choose one for any Category below.'],
    ['ckb', 'هێشتا هیچ پارچەیەک هەڵنەبژێردراوە. بۆ هەر پۆلێکی خوارەوە یەکێک هەڵبژێرە.'],
    ['ar', 'لم تُختر أي قطعة بعد. اختر قطعة لأي فئة أدناه.'],
  ])('says that no Part is chosen yet in an empty Build, in %s', (language, sentence) => {
    const status = statusOf(empty, language);

    expect(read(status.sentence)).toBe(sentence);
    expect(status.lines).toEqual([]);
  });

  const needingFour = aBuild(['cpu', 'motherboard', 'ram', 'gpu'], {
    stillNeeded: ['cpuCooler', 'storage', 'case', 'psu'],
  });

  it.each<[Language, string]>([
    ['en', 'Still needs a CPU cooler, storage, a case and a PSU.'],
    [
      'ckb',
      'هێشتا پێویستی بە ساردکەرەوەی پرۆسێسەر، بیرگەی هەڵگرتن، کەیس و پاوەر سەپلای هەیە.',
    ],
    ['ar', 'لا تزال تحتاج إلى مبرّد معالج، ووحدة تخزين، وصندوق حاسوب، ومزوّد طاقة.'],
  ])(
    'names the Categories it still needs, in the catalog’s order, in %s',
    (language, sentence) => {
      const status = statusOf(needingFour, language);

      expect(read(status.sentence)).toBe(sentence);
      expect(
        status.sentence.flatMap((piece) =>
          typeof piece === 'string' ? [] : [piece.category],
        ),
      ).toEqual(['cpuCooler', 'storage', 'case', 'psu']);
    },
  );

  it.each<[Language, string]>([
    ['en', 'Still needs a PSU.'],
    ['ckb', 'هێشتا پێویستی بە پاوەر سەپلای هەیە.'],
    ['ar', 'لا تزال تحتاج إلى مزوّد طاقة.'],
  ])('names one Category alone, in %s', (language, sentence) => {
    const status = statusOf(
      aBuild(['cpu', 'cpuCooler', 'motherboard', 'ram', 'storage', 'gpu', 'case'], {
        stillNeeded: ['psu'],
      }),
      language,
    );

    expect(read(status.sentence)).toBe(sentence);
  });

  const complete = [
    'cpu',
    'cpuCooler',
    'motherboard',
    'ram',
    'storage',
    'gpu',
    'case',
    'psu',
  ];

  it.each<[Language, string]>([
    ['en', 'A Complete Build: it holds every Part a PC needs.'],
    ['ckb', 'بیڵدێکی تەواو: هەموو ئەو پارچانەی تێدایە کە کۆمپیوتەرێک پێویستیەتی.'],
    ['ar', 'تجميعة مكتملة: فيها كل قطعة يحتاجها الحاسوب.'],
  ])('says a Complete Build is one, in %s', (language, sentence) => {
    const status = statusOf(
      aBuild(complete as Category[], { complete: true, outcomes: [aPass] }),
      language,
    );

    expect(read(status.sentence)).toBe(sentence);
    expect(status.stamped).toBe(true);
  });

  // A Build complete in its Categories that holds Problems is not stamped
  // (break-ui, builder ticket 06).
  it.each<[Language, number, string]>([
    ['en', 1, 'A Complete Build, with a Problem to settle: see what the rules found.'],
    ['en', 8, 'A Complete Build, with 8 Problems to settle: see what the rules found.'],
    ['ckb', 8, 'بیڵدێکی تەواو، بەڵام 8 کێشەی گونجانی تێدایە: سەیری ئەنجامی یاساکان بکە.'],
    ['ar', 8, 'تجميعة مكتملة، فيها 8 مشكلات توافق يجب حلها: انظر ما وجدته القواعد.'],
  ])(
    'counts the Problems of a Complete Build and leaves it unstamped, in %s with %i',
    (language, problems, sentence) => {
      const status = statusOf(
        aBuild(complete as Category[], {
          complete: true,
          outcomes: [aPass, ...Array.from({ length: problems }, () => aProblem)],
        }),
        language,
      );

      expect(read(status.sentence)).toBe(sentence);
      expect(status.stamped).toBe(false);
    },
  );

  // The CPU's values that the rule for a Complete Build reads.
  describe('the lines about the CPU', () => {
    it.each<[Language, string[]]>([
      [
        'en',
        [
          'Your CPU has integrated graphics, so a GPU is not needed.',
          'Your CPU comes with a cooler, so a CPU cooler is not needed.',
        ],
      ],
      [
        'ckb',
        [
          'پرۆسێسەرەکەت گرافیکی تێدایە، بۆیە کارتی گرافیک پێویست نییە.',
          'پرۆسێسەرەکەت ساردکەرەوەی لەگەڵدایە، بۆیە ساردکەرەوەی پرۆسێسەر پێویست نییە.',
        ],
      ],
      [
        'ar',
        [
          'في معالجك رسوميات مدمجة، لذا لا حاجة إلى بطاقة رسومات.',
          'يأتي معالجك مع مبرّد، لذا لا حاجة إلى مبرّد معالج.',
        ],
      ],
    ])(
      'say the CPU stands in for a GPU and a cooler the Build lacks, in %s',
      (language, lines) => {
        const status = statusOf(
          aBuild(['cpu', 'motherboard'], {
            stillNeeded: ['ram', 'storage', 'case', 'psu'],
          }),
          language,
        );

        expect(status.lines).toEqual(lines);
      },
    );

    it.each<[Language, string[]]>([
      [
        'en',
        [
          'Your CPU does not say whether it has integrated graphics, so a GPU is counted as needed.',
          'Your CPU does not say whether it comes with a cooler, so a CPU cooler is counted as needed.',
        ],
      ],
      [
        'ckb',
        [
          'پرۆسێسەرەکەت ناڵێت گرافیکی تێدایە یان نا، بۆیە کارتی گرافیک بە پێویست دادەنرێت.',
          'پرۆسێسەرەکەت ناڵێت ساردکەرەوەی لەگەڵدایە یان نا، بۆیە ساردکەرەوەی پرۆسێسەر بە پێویست دادەنرێت.',
        ],
      ],
      [
        'ar',
        [
          'لا يذكر معالجك إن كانت فيه رسوميات مدمجة، لذا تُحسب بطاقة الرسومات مطلوبة.',
          'لا يذكر معالجك إن كان يأتي مع مبرّد، لذا يُحسب مبرّد المعالج مطلوبًا.',
        ],
      ],
    ])('say the CPU does not say, when the API says so, in %s', (language, lines) => {
      const status = statusOf(
        aBuild(['cpu'], {
          stillNeeded: ['cpuCooler', 'motherboard', 'ram', 'storage', 'gpu', 'case', 'psu'],
          cpuValuesNotKnown: ['integratedGraphics', 'includesCooler'],
        }),
        language,
      );

      expect(status.lines).toEqual(lines);
    });

    it('say nothing of a GPU or a cooler the Build holds', () => {
      expect(
        statusOf(aBuild(['cpu', 'cpuCooler', 'gpu'], { stillNeeded: ['psu'] }), 'en').lines,
      ).toEqual([]);
      expect(
        statusOf(
          aBuild(['cpu', 'cpuCooler', 'gpu'], {
            stillNeeded: ['psu'],
            cpuValuesNotKnown: ['integratedGraphics', 'includesCooler'],
          }),
          'en',
        ).lines,
      ).toEqual([]);
    });

    it('say nothing when the CPU provides neither, the GPU and the cooler named as needed', () => {
      expect(
        statusOf(aBuild(['cpu'], { stillNeeded: ['cpuCooler', 'gpu', 'psu'] }), 'en').lines,
      ).toEqual([]);
    });

    it('say nothing without a CPU', () => {
      expect(
        statusOf(aBuild(['psu'], { stillNeeded: ['cpu', 'cpuCooler', 'gpu'] }), 'en').lines,
      ).toEqual([]);
    });

    it('say one line when the CPU has graphics and the Build holds a cooler', () => {
      expect(
        statusOf(aBuild(['cpu', 'cpuCooler'], { stillNeeded: ['psu'] }), 'en').lines,
      ).toEqual(['Your CPU has integrated graphics, so a GPU is not needed.']);
    });

    // A Shared Build's page speaks of the Build as the sender's, never the
    // reader's (DESIGN.md's The Shared Build page).
    it.each<[Language, string[]]>([
      [
        'en',
        [
          'Its CPU has integrated graphics, so a GPU is not needed.',
          'Its CPU does not say whether it comes with a cooler, so a CPU cooler is counted as needed.',
        ],
      ],
      [
        'ckb',
        [
          'پرۆسێسەرەکەی گرافیکی تێدایە، بۆیە کارتی گرافیک پێویست نییە.',
          'پرۆسێسەرەکەی ناڵێت ساردکەرەوەی لەگەڵدایە یان نا، بۆیە ساردکەرەوەی پرۆسێسەر بە پێویست دادەنرێت.',
        ],
      ],
      [
        'ar',
        [
          'في معالجها رسوميات مدمجة، لذا لا حاجة إلى بطاقة رسومات.',
          'لا يذكر معالجها إن كان يأتي مع مبرّد، لذا يُحسب مبرّد المعالج مطلوبًا.',
        ],
      ],
    ])("speak of a Shared Build's CPU as its own, in %s", (language, lines) => {
      const status = statusOf(
        aBuild(['cpu', 'motherboard'], {
          stillNeeded: ['cpuCooler', 'ram', 'storage', 'case', 'psu'],
          cpuValuesNotKnown: ['includesCooler'],
        }),
        language,
        'shared',
      );

      expect(status.lines).toEqual(lines);
    });
  });
});
