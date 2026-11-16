import type { BuildResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { photographs } from '@/shared/photographs';
import {
  DimPhotograph,
  Item,
  PrintedMark,
  Sheet,
  sheetGroup,
  sheetGroupHeading,
  SheetNote,
  SheetTitle,
} from '@/shared/ui';

import {
  findingsOf,
  type Found,
  powerDrawOf,
  rulesInAll,
  type WordedOutcome,
} from '../model/findings';
import { NamedUnder, PartName } from './named-under';

// The heading of each group, keyed by what its outcomes found.
const groupsOf = {
  problem: 'problems',
  warning: 'warnings',
  unchecked: 'notChecked',
} as const;

// The rules' sheet (DESIGN.md's The rules' sheet), centred over a dim
// photograph of a board below the Build's sheet: the printed sheet titled
// "What the rules found", its note naming the 21 Compatibility Rules; then
// the outcomes in three groups, each under a Label that counts it, the
// Compatibility Problems, then the Compatibility Warnings, then the rules not
// checked, each group in rule order, an outcome its printed mark and its
// words (DESIGN.md's The words of an outcome). A Build with none of them says
// so as its sentence, counting the rules that passed. Then two lines of the
// sheet, how many rules were checked and passed and the Estimated power
// draw, or the Parts whose TDP is missing; and its closing line, that the
// Build is kept as it is: the page never stops the Shopper keeping a Build
// the rules find fault with (BLD-4). An empty Build has no rules' sheet.
//
// It is below the first screen, so it prints as it comes into view (Motion
// 1). Each line a change in place may bring or take, a group and an
// outcome, is named for the page's script, and so are the space they share
// and each figure a change may alter, so that what a change brings prints
// in and nothing below it jumps (Motion 11).
export async function RulesSheet({ answer }: { answer: BuildResponse }) {
  const [language, t] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage.rules'),
  ]);
  const findings = findingsOf(answer, language);
  const power = powerDrawOf(answer);
  const groups = (['problem', 'warning', 'unchecked'] as const).map((found) => ({
    found,
    outcomes: {
      problem: findings.problems,
      warning: findings.warnings,
      unchecked: findings.unchecked,
    }[found],
  }));
  const nothingFound = groups.every(({ outcomes }) => outcomes.length === 0);

  return (
    <section
      aria-labelledby="rules-title"
      className="relative isolate px-ground-edge py-section-phone md:page-margins md:py-section"
    >
      <DimPhotograph photograph={photographs.motherboardCloseup} />
      <div
        id="rules"
        className="mx-auto grid w-full max-w-[40rem] scroll-mt-6 justify-items-center"
      >
        <Sheet print="in-view">
          <SheetTitle id="rules-title">{t('title')}</SheetTitle>
          <SheetNote>{t('note', { rules: formatNumber(rulesInAll) })}</SheetNote>
          {/* What the rules found, read to a screen reader when a change in
              place alters it, its space moving with what it says. */}
          <div data-space="rules" className="grid grid-cols-[minmax(0,1fr)]">
            {nothingFound && (
              <output
                data-testid="rules-sentence"
                data-line="nothing-found"
                className="mx-auto mt-4 block max-w-[34ch] text-center text-lg text-balance"
              >
                {findings.passed === 0
                  ? t('noneApply')
                  : t('allPassed', {
                      count: findings.passed,
                      countText: formatNumber(findings.passed),
                    })}
              </output>
            )}
            {groups.map(
              ({ found, outcomes }) =>
                outcomes.length > 0 && (
                  <section
                    key={found}
                    data-line={`group-${found}`}
                    data-testid={`outcomes-${found}`}
                    className={cn(
                      sheetGroup,
                      'mt-group grid grid-cols-[minmax(0,1fr)] gap-5',
                    )}
                  >
                    <h3 className={sheetGroupHeading}>
                      <span data-figure={`group-${found}`}>
                        {t(groupsOf[found], {
                          count: outcomes.length,
                          countText: formatNumber(outcomes.length),
                        })}
                      </span>
                    </h3>
                    <ul className="grid grid-cols-[minmax(0,1fr)] gap-5">
                      {outcomes.map((outcome) => (
                        <Outcome key={outcome.rule} outcome={outcome} found={found} />
                      ))}
                    </ul>
                  </section>
                ),
            )}
          </div>

          <ul
            data-space="rules-lines"
            className="@container mt-group grid grid-cols-[minmax(0,1fr)] gap-4"
          >
            <Item
              testId="rules-passed"
              place={0}
              name={t('passed')}
              end={<span data-figure="rules-passed">{formatNumber(findings.passed)}</span>}
            />
            {power !== undefined && (
              <Item
                testId="power-draw"
                place={1}
                name={t('powerDraw')}
                end={
                  'watts' in power ? (
                    <AlwaysEnglish data-figure="rules-power">{power.watts}</AlwaysEnglish>
                  ) : (
                    <span data-figure="rules-power">—</span>
                  )
                }
                second={
                  'missing' in power ? (
                    <span className="grid grid-cols-[minmax(0,1fr)] gap-1">
                      {power.missing.map(({ part, specification }) => (
                        <span
                          key={`${part.id} ${specification}`}
                          data-testid="power-not-known"
                        >
                          {t.rich('powerNotKnown', {
                            part: part.name,
                            specification,
                            english: (chunks: ReactNode) => (
                              <AlwaysEnglish>{chunks}</AlwaysEnglish>
                            ),
                          })}
                        </span>
                      ))}
                    </span>
                  ) : undefined
                }
              />
            )}
          </ul>
          <p className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground">
            {t('kept')}
          </p>
        </Sheet>
      </div>
    </section>
  );
}

// An outcome (DESIGN.md's The words of an outcome): its printed mark at the
// start, 4 pixels down, and its words beside it, in Body large, the sentence
// for its rule in the page's language; under it, in Body Soft Ink, the Parts
// it names, each on a line of its own, in English, or, for an unchecked
// rule, each specification its Parts lack, by its English label, with its
// Part. No Part's name stands inside the sentence.
async function Outcome({ outcome, found }: { outcome: WordedOutcome; found: Found }) {
  const t = await getTranslations('BuildPage.rules');
  const english = (chunks: ReactNode) => <AlwaysEnglish>{chunks}</AlwaysEnglish>;
  const lines =
    found === 'unchecked'
      ? outcome.missing.map(({ specification, part }) => ({
          key: `${part.id} ${specification}`,
          line: (
            <span data-testid="not-in-the-catalog" data-specification={specification}>
              {t.rich('notInTheCatalog', { specification, english })}
              {' · '}
              <PartName part={part} />
            </span>
          ),
        }))
      : outcome.parts.map((part) => ({ key: part.id, line: <PartName part={part} /> }));

  return (
    <li
      data-line={`outcome-${outcome.rule}-${found}`}
      data-testid="outcome"
      data-rule={outcome.rule}
      data-outcome={found}
      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3"
    >
      <span className="mt-1 text-foreground">
        <PrintedMark kind={found} />
      </span>
      <div className="min-w-0 wrap-break-word">
        <p data-testid="outcome-words" className="text-lg">
          {outcome.words}
        </p>
        <NamedUnder lines={lines} />
      </div>
    </li>
  );
}
