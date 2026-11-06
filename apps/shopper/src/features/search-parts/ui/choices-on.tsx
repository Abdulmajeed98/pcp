import { AsWritten } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

import type { Category } from '@/entities/category';

import { type CategoryQuery, categoryPageAddress } from '../model/category-query';

// The choices that are on, and clearing them (DESIGN.md's The choices that
// are on): at the head of a Category's sheet, under its note, once a choice
// is on, one chip of Print Green for each, with a × after its words, each a
// link to the same list without it and named for a screen reader as
// removing it; then Clear all, an underlined link to the list with nothing
// on. The search is the one choice there is: its words are as the Shopper
// typed them, in their own direction. A list that the choices empty offers
// Clear all as its primary button instead, and the row leaves it out
// (`withClearAll`).
//
// Each is a link, which works before any script has loaded; with script the
// list is drawn again in place, shown printed. The list without a choice
// starts again at its first page.
export async function ChoicesOn({
  category,
  query,
  withClearAll,
}: {
  category: Category;
  query: CategoryQuery;
  withClearAll: boolean;
}) {
  if (query.search === '') return null;
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);
  const nothingOn = categoryPageAddress(language, category, { search: '', page: 1 });

  return (
    <nav
      aria-label={t('choicesOn')}
      data-testid="choices-on"
      className="mt-4.5 flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        href={nothingOn}
        prefetch={false}
        data-testid="choice-on"
        aria-label={t('removeTheSearch', { search: query.search })}
        className="pressable no-callout inline-flex min-h-control max-w-full items-center gap-2 bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed"
      >
        <AsWritten className="min-w-0 wrap-break-word">{query.search}</AsWritten>
        <span aria-hidden="true" className="text-lg leading-none">
          ×
        </span>
      </Link>
      {withClearAll && (
        <Link
          href={nothingOn}
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
