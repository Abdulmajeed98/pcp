import type { BuildResponse } from '@pcp/api-client';
import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import { createTranslator } from 'next-intl';

import { outcomeCountsOf } from './findings';

type Category = BuildResponse['stillNeeded'][number];

// What the Build page's status reads of the API's answer.
type Answered = Pick<
  BuildResponse,
  'parts' | 'complete' | 'stillNeeded' | 'cpuValuesNotKnown' | 'outcomes'
>;

// A piece of the status's sentence: its words, or a Category the Build still
// needs, which the page draws as a link to that Category's picker.
export type StatusPiece = string | { category: Category; words: string };

// Whose Build a page shows: the Shopper's own, on the Build page, or a
// Shared Build, whose page speaks of it as the sender's, never the reader's
// (DESIGN.md's The Shared Build page).
export type Whose = 'yours' | 'shared';

// The Build page's status (DESIGN.md's The status), in the page's language:
// its sentence; a line for each value of the CPU that the rule for a Complete
// Build read; and whether the slip is stamped "Complete Build".
export interface Status {
  sentence: StatusPiece[];
  lines: string[];
  stamped: boolean;
}

// The status of a Build, from the API's answer: a Complete Build, which says
// how many Problems remain when it holds any; the Categories it still needs,
// in the catalog's order, as the API answers them; or, for an empty Build,
// that no Part is chosen yet. The slip is stamped only for a Complete Build
// with no Compatibility Problem (break-ui, builder ticket 06).
//
// Under the sentence, a line for each value of the CPU the rule read, when
// the Build holds a CPU and no Part of the Category the value stands in for:
// that the CPU has integrated graphics or comes with a cooler, so that one is
// not needed; or, when the API says the CPU does not hold the value, that it
// does not say, so that one is counted as needed. A Shared Build's lines
// speak of its CPU, "Its CPU has integrated graphics…".
export function statusOf(
  answer: Answered,
  language: Language,
  whose: Whose = 'yours',
): Status {
  const t = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'BuildPage.status',
  });
  const itsCpu = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'SharedBuildPage.status',
  });
  const aboutTheCpu = whose === 'yours' ? t : itsCpu;
  const problems = outcomeCountsOf(answer.outcomes).problem;
  const holds = (category: Category) =>
    answer.parts.some((part) => part.category === category);

  const lines: string[] = [];
  if (holds('cpu')) {
    const lineFor = (
      category: Category,
      value: BuildResponse['cpuValuesNotKnown'][number],
      provided: 'hasGraphics' | 'includesCooler',
      notKnown: 'graphicsNotKnown' | 'coolerNotKnown',
    ) => {
      if (holds(category)) return;
      if (answer.cpuValuesNotKnown.includes(value)) lines.push(aboutTheCpu(notKnown));
      else if (!answer.stillNeeded.includes(category)) {
        lines.push(aboutTheCpu(provided));
      }
    };
    lineFor('gpu', 'integratedGraphics', 'hasGraphics', 'graphicsNotKnown');
    lineFor('cpuCooler', 'includesCooler', 'includesCooler', 'coolerNotKnown');
  }

  if (answer.parts.length === 0) {
    return { sentence: [t('empty')], lines, stamped: false };
  }
  if (answer.complete) {
    return {
      sentence: [
        problems === 0
          ? t('complete')
          : t('completeWithProblems', {
              count: problems,
              countText: formatNumber(problems),
            }),
      ],
      lines,
      stamped: problems === 0,
    };
  }
  return { sentence: stillNeeds(answer.stillNeeded, t), lines, stamped: false };
}

// "Still needs a CPU cooler, storage, a case and a PSU.": the sentence with
// each Category in it as a piece of its own, joined as the language joins a
// list. The list's place in the sentence is the language's, so the sentence
// is translated whole and cut where the list stands.
function stillNeeds(
  categories: readonly Category[],
  t: ReturnType<typeof createTranslator<typeof shopperMessages.en, 'BuildPage.status'>>,
): StatusPiece[] {
  const where = '\u0000';
  const [before = '', after = ''] = t('stillNeeds', { list: where }).split(where);
  const list = categories.flatMap((category, place): StatusPiece[] => {
    const piece = { category, words: t('category', { category }) };
    if (place === 0) return [piece];
    return [place === categories.length - 1 ? t('listAnd') : t('listComma'), piece];
  });
  return [before, ...list, after].filter((piece) => piece !== '');
}
