import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category';
import { VisiblePartItem } from '@/entities/part';
import {
  ChoicesOn,
  type CategoryQuery,
  categoryPageAddress,
  choicesOn,
  nothingOn,
  type OfferedFilters,
} from '@/features/search-parts';
import {
  CategoryDrawing,
  Paging,
  Sheet,
  SheetAction,
  SheetGroup,
  SheetTitle,
  Stamp,
} from '@/shared/ui';

import { whatTheSheetShows } from '../model/what-the-sheet-shows';

// A Category's sheet on its page (DESIGN.md's A Category page): the printed
// sheet, its title the Category's name as the page's `h1`, then the page's
// one sentence of what it shows, in Body large in the Ink, as the not-found
// page's note is, since it is what the page says; the choices that are on,
// the Category's drawing, and the list, in BRW-1's order as the API answers
// it: under "In stock" the Parts some Vendor has in stock, lowest price
// first, then under "Out of stock at every Vendor" the rest, each marked so.
// Paging and the closing line follow, and under it what "≈" means when a
// price on the page is converted, both in Body Soft Ink and at most 34rem
// wide: they are the sheet's running text, which a list whose filters leave
// no converted price would otherwise set in Small alone (Taste's inspector,
// ticket 11). The stamp says
// "Lowest price first", in the sheet's end corner when the sheet holds 30rem
// inside its padding, and under its title on a narrower one, as beside the
// swing tag at 1024 pixels and on a phone, so that it never runs into a
// long title. It is on the first screen, so it prints as the page opens.
//
// A sheet that lists nothing says why, and the two empty lists are told
// apart in words (DESIGN.md's The empty states): a Category no Vendor offers
// yet leads to the other Categories, and a search or filters that found
// nothing offer to clear them all. A page past the last leads to the first,
// and a list the API did not answer offers to try again, at the same address
// as it was asked (`asAsked`).
//
// The sentence under the title is where the sheet says what it shows, so it
// is the page's status (`output`): drawn again in place with script, its new
// words are read to a screen reader without moving the focus.
export async function CategorySheet({
  category,
  query,
  offered,
  page,
  asAsked,
  className,
}: {
  category: Category;
  query: CategoryQuery;
  offered: OfferedFilters | undefined;
  page: VisiblePartPageResponse | undefined;
  asAsked: string;
  className?: string;
}) {
  const [language, t, searchWords, categoryName, paging] = await Promise.all([
    getLocale(),
    getTranslations('CategoryPage'),
    getTranslations('SearchParts'),
    getTranslations('Category'),
    getTranslations('Paging'),
  ]);
  const state = whatTheSheetShows(page, query);
  const addressAt = (at: CategoryQuery) => categoryPageAddress(language, category, at);
  const listed = state.kind === 'listed';

  // What the sheet says under its title, and what it holds under its
  // drawing: the list, or the one way out of a sheet that lists nothing.
  const { sentence, line, holds } = ((): {
    sentence: string;
    line?: string;
    holds: ReactNode;
  } => {
    switch (state.kind) {
      case 'listed':
        return {
          sentence: t(choicesOn(query).length === 0 ? 'note' : 'found', {
            count: state.page.totalElements,
            countText: formatNumber(state.page.totalElements),
          }),
          holds: (
            <>
              <TheList parts={state.page.content} />
              <Paging
                page={query.page}
                totalPages={state.page.totalPages}
                addressOf={(page) => addressAt({ ...query, page })}
              />
              <p className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground">
                {t('close')}
              </p>
              {state.page.content.some((part) => part.lowestPrice?.converted === true) && (
                <p
                  data-testid="what-approximately-means"
                  className="mx-auto mt-3 max-w-[34rem] text-center text-muted-foreground"
                >
                  {t('approximately')}
                </p>
              )}
            </>
          ),
        };
      case 'none-yet':
        return {
          sentence: t('noneYet', { category }),
          line: t('noneYetLine'),
          holds: (
            <SheetAction
              kind="board"
              address={`/${language}#categories`}
              plain
              testId="choose-another-category"
            >
              {t('chooseAnotherCategory')}
            </SheetAction>
          ),
        };
      case 'no-match':
        return {
          sentence: t('noMatch', { category }),
          holds: (
            <SheetAction kind="primary" address={addressAt(nothingOn)} testId="clear-all">
              {searchWords('clearAll')}
            </SheetAction>
          ),
        };
      case 'past-the-end':
        return {
          sentence: paging('pastTheEnd', {
            pages: state.totalPages,
            pagesText: formatNumber(state.totalPages),
          }),
          holds: (
            <SheetAction
              kind="primary"
              address={addressAt({ ...query, page: 1 })}
              testId="to-the-first-page"
            >
              {paging('toTheFirstPage')}
            </SheetAction>
          ),
        };
      case 'not-read':
        return {
          sentence: t('notRead'),
          holds: (
            <SheetAction kind="board" address={asAsked} testId="try-again">
              {t('tryAgain')}
            </SheetAction>
          ),
        };
    }
  })();

  return (
    <Sheet
      print="arrival"
      className={cn('@container', className)}
      frameClassName="lg:col-span-7 lg:max-w-none"
    >
      <SheetTitle as="h1">{categoryName(category)}</SheetTitle>
      {listed && (
        <Stamp className="static mx-auto mt-3.5 table text-[1.125rem] @[30rem]:absolute @[30rem]:end-[22px] @[30rem]:top-[26px] @[30rem]:mt-0">
          {t('stamp')}
        </Stamp>
      )}
      <output
        data-testid="sheet-says"
        data-state={state.kind}
        className={cn(
          'mx-auto mt-4 block text-center text-lg text-balance',
          listed ? 'max-w-[34ch]' : 'max-w-[26ch]',
        )}
      >
        {sentence}
      </output>
      {line !== undefined && (
        <p className="mt-2.5 text-center text-sm text-muted-foreground">{line}</p>
      )}
      <ChoicesOn
        category={category}
        query={query}
        offered={offered}
        withClearAll={listed}
      />
      <CategoryDrawing category={category} />
      {holds}
    </Sheet>
  );
}

// The page of the list, in its two groups: the Parts in stock, in the API's
// order, which puts the lowest price first, then those every Vendor has out
// of stock, which the API puts last. Each Part's price settles in its turn as
// the sheet prints.
async function TheList({ parts }: { parts: readonly VisiblePartResponse[] }) {
  const t = await getTranslations('CategoryPage');
  const inStock = parts.filter((part) => part.inStock);
  const outOfStock = parts.filter((part) => !part.inStock);

  return (
    <>
      {inStock.length > 0 && (
        <SheetGroup heading={t('inStock')} as="h2" testId="in-stock">
          {inStock.map((part, place) => (
            <VisiblePartItem key={part.id} part={part} place={place} />
          ))}
        </SheetGroup>
      )}
      {outOfStock.length > 0 && (
        <SheetGroup
          heading={t('outOfStockEverywhere')}
          as="h2"
          testId="out-of-stock-everywhere"
        >
          {outOfStock.map((part, place) => (
            <VisiblePartItem key={part.id} part={part} place={inStock.length + place} />
          ))}
        </SheetGroup>
      )}
    </>
  );
}
