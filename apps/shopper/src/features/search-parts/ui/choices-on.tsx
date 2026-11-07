import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category';
import { currencyMarks } from '@/shared/currency';

import {
  type CategoryQuery,
  categoryPageAddress,
  type ChoiceOn,
  choicesOn,
  nothingOn,
  type OfferedFilters,
} from '../model/category-query';
import { type SearchWords, wordsOfAValue } from './value-words';

// The choices that are on, and clearing them (DESIGN.md's The choices that
// are on): at the head of a Category's sheet, under its note, once a choice
// is on, one chip of Print Green for each, in the order of the address (the
// search's words, each manufacturer, each value of a filter, the price
// range), with a × after its words, each a link to the same list without it
// and named for a screen reader as removing it, "Remove AM5"; then Clear all,
// an underlined link to the list with nothing on. The search's words are as
// the Shopper typed them, in their own direction; a manufacturer, a value and
// a price are in English and left to right, and a number with no unit is
// named by its filter, "Cores 8". A list that the choices empty offers Clear
// all as its primary button instead, and the row leaves it out
// (`withClearAll`).
//
// Each is a link, which works before any script has loaded; with script the
// list is drawn again in place, shown printed. The list without a choice
// starts again at its first page.
export async function ChoicesOn({
  category,
  query,
  offered,
  withClearAll,
}: {
  category: Category;
  query: CategoryQuery;
  offered: OfferedFilters | undefined;
  withClearAll: boolean;
}) {
  const choices = choicesOn(query);
  if (choices.length === 0) return null;
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);

  return (
    <nav
      aria-label={t('choicesOn')}
      data-testid="choices-on"
      className="mt-4.5 flex flex-wrap items-center justify-center gap-1.5"
    >
      {choices.map((choice) => {
        const { words, name, id } = wordsOfAChoice(choice, offered, t);
        return (
          <Link
            key={id}
            href={categoryPageAddress(language, category, choice.without)}
            prefetch={false}
            data-testid="choice-on"
            data-choice={id}
            aria-label={name}
            className="pressable no-callout inline-flex min-h-control max-w-full items-center gap-2 bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed"
          >
            <span className="min-w-0 wrap-break-word">{words}</span>
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </Link>
        );
      })}
      {withClearAll && (
        <Link
          href={categoryPageAddress(language, category, nothingOn)}
          prefetch={false}
          data-testid="clear-all"
          className="hover-underline inline-flex min-h-control items-center px-2"
        >
          {t('clearAll')}
        </Link>
      )}
    </nav>
  );
}

// A choice's words on its chip, its name for a screen reader, and what tells
// it apart from the others (`data-choice`): `search`, `price`, or its
// parameter and its value as the address writes them, `socket=AM5`.
function wordsOfAChoice(
  choice: ChoiceOn,
  offered: OfferedFilters | undefined,
  t: SearchWords,
): { words: ReactNode; name: string; id: string } {
  const english = (chunks: ReactNode) => <AlwaysEnglish>{chunks}</AlwaysEnglish>;
  const plain = (chunks: string) => chunks;

  switch (choice.kind) {
    case 'search':
      return {
        words: <AsWritten>{choice.search}</AsWritten>,
        name: t('removeTheSearch', { search: choice.search }),
        id: 'search',
      };
    case 'manufacturer':
      return {
        words: english(choice.manufacturer),
        name: t('removeChoice', { choice: choice.manufacturer }),
        id: `manufacturer=${choice.manufacturer}`,
      };
    case 'filter': {
      const filter = offered?.filters.find(
        ({ parameter }) => parameter === choice.parameter,
      );
      const { words, text } = wordsOfAValue(
        filter ?? { parameter: choice.parameter, kind: 'text' },
        choice.value,
        t,
        { named: true },
      );
      return {
        words,
        name: t('removeChoice', { choice: text }),
        id: `${choice.parameter}=${String(choice.value)}`,
      };
    }
    case 'price': {
      const range = {
        ends:
          choice.lowest !== null && choice.highest !== null
            ? 'both'
            : choice.lowest !== null
              ? 'lowest'
              : 'highest',
        lowest: choice.lowest === null ? '' : formatNumber(choice.lowest),
        highest: choice.highest === null ? '' : formatNumber(choice.highest),
        unit: offered === undefined ? '' : currencyMarks[offered.priceRange.currency],
      };
      return {
        words: t.rich('priceRange', { ...range, english }),
        name: t('removeThePriceRange', {
          range: t.markup('priceRange', { ...range, english: plain }),
        }),
        id: 'price',
      };
    }
  }
}
