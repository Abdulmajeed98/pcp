import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Build } from '@/entities/build';
import type { Category } from '@/entities/category';
import {
  addressAfterAChange,
  buildAddress,
  pickerAddress,
} from '@/features/change-the-build';
import {
  allCleared,
  ChoicesOn,
  type OfferedFilters,
  type PickerQuery,
  switchedTo,
} from '@/features/search-parts';
import {
  buttonVariants,
  CategoryDrawing,
  Paging,
  Sheet,
  SheetAction,
  SheetTitle,
  Stamp,
} from '@/shared/ui';

import { pickerPageAddress } from '../model/picker-address';
import type { PickerSays, PickerState } from '../model/what-the-picker-shows';
import { PickerPart } from './picker-part';
import { TheSwitch } from './the-switch';

// The picker's sheet (DESIGN.md's The picker, Its sheet): a Category page's
// sheet for picking, its title "Choose a CPU" in the Sheet title as the
// page's `h1`, the stamp "Lowest price first" under it at every width, since
// a picker's title is longer than a Category's and ran into the stamp in
// the sheet's end corner, in Kurdish at every desk width, its sentence in
// Body large,
// "3 CPUs in stock that fit your Build, lowest price first.", or with the
// switch on "8 CPUs in stock, lowest price first. 5 do not fit your Build.";
// then the switch, once the Build holds a Part; the choices that are on; the
// Category's drawing; and the list, in stock only, in the API's order, 20
// to a page with Paging, each Part with its pick control. It closes, as a
// Category's sheet does, with its closing line and, when a price on it is
// converted, what "≈" means, in Body Soft Ink and at most 34rem wide.
//
// A sheet that lists nothing says why (DESIGN.md's The empty states), each
// way in words of its own: a list the Build leaves empty says how many Parts
// in stock it would show, with "Show all 7 RAM kits", the switch, as the
// sheet's primary button, and "See why on your Build", a cell to the rules'
// sheet; a search or filters that found nothing offer Clear all, which keeps
// the switch; a Category no Vendor has in stock leads back to the Build, at
// the Category's place. A page past the last and a list the API did not
// answer say so as a Category page does.
//
// The sentence is the page's status (`output`): drawn again in place with
// script, by a search, a filter, the switch or another page, its new words
// are read to a screen reader without moving the focus.
export async function PickerSheet({
  category,
  query,
  offered,
  state,
  build,
  judged,
  asAsked,
}: {
  category: Category;
  query: PickerQuery;
  offered: OfferedFilters | undefined;
  state: PickerState;
  build: Build;
  // Whether the list was judged against the Build, which holds a Part.
  judged: boolean;
  // The picker's address as it was asked, which Try again leads to.
  asAsked: string;
}) {
  const [language, t, categoryPage, searchWords, paging, buildWords] = await Promise.all([
    getLocale(),
    getTranslations('PickerPage'),
    getTranslations('CategoryPage'),
    getTranslations('SearchParts'),
    getTranslations('Paging'),
    getTranslations('BuildPage'),
  ]);
  const addressAt = (at: PickerQuery) => pickerPageAddress(language, category, at);
  const counting = (count: number) => ({ category, count, countText: formatNumber(count) });
  const listed = state.kind === 'listed';

  const said = (says: PickerSays) => {
    switch (says.kind) {
      case 'in-stock':
        return t('inStock', counting(says.count));
      case 'fit':
        return t('fit', counting(says.count));
      case 'some-do-not-fit':
        return `${t('inStock', counting(says.count))} ${t('notFit', counting(says.notFit))}`;
    }
  };

  // What the sheet says under its title, and what it holds under its
  // drawing: the list, or the way out of a sheet that lists nothing.
  const {
    sentence,
    line,
    holds,
  }: {
    sentence: string;
    line?: { text: string; size: 'body' | 'small' };
    holds: ReactNode;
  } = (() => {
    switch (state.kind) {
      case 'listed':
        return {
          sentence: said(state.says),
          holds: (
            <>
              <ul
                data-testid="picker-list"
                className="mt-group grid grid-cols-[minmax(0,1fr)] gap-5"
              >
                {state.page.content.map((part, place) => (
                  <PickerPart
                    key={part.id}
                    part={part}
                    place={place}
                    held={build.find((each) => each.part === part.id)}
                  />
                ))}
              </ul>
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
                  {categoryPage('approximately')}
                </p>
              )}
            </>
          ),
        };
      case 'none-fits':
        return {
          sentence: t('noneFits', counting(state.inStock)),
          line: { text: t('noneFitsLine'), size: 'body' },
          holds: (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link
                href={addressAt(switchedTo(query, true))}
                prefetch={false}
                data-testid="show-all"
                className={buttonVariants({ kind: 'primary', className: 'max-w-full' })}
              >
                {t('showAll', counting(state.inStock))}
              </Link>
              <a
                href={`${buildAddress(language)}#rules`}
                data-testid="see-why"
                className={buttonVariants({ kind: 'board', className: 'max-w-full' })}
              >
                {t('seeWhy')}
              </a>
            </div>
          ),
        };
      case 'no-match':
        return {
          sentence: t('noMatch', { category }),
          holds: (
            <SheetAction
              kind="primary"
              address={addressAt(allCleared(query))}
              testId="clear-all"
            >
              {searchWords('clearAll')}
            </SheetAction>
          ),
        };
      case 'none-in-stock':
        return {
          sentence: t('noneInStock', { category }),
          line: { text: categoryPage('noneYetLine'), size: 'small' },
          holds: (
            <SheetAction
              kind="board"
              address={addressAfterAChange(language, { at: category })}
              plain
              testId="back-to-your-build"
            >
              {t('backToYourBuild')}
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
          sentence: categoryPage('notRead'),
          holds: (
            <SheetAction kind="board" address={asAsked} testId="try-again">
              {categoryPage('tryAgain')}
            </SheetAction>
          ),
        };
    }
  })();

  return (
    <Sheet
      print="arrival"
      className="@container"
      frameClassName="lg:col-span-7 lg:max-w-none"
    >
      <SheetTitle as="h1">{buildWords('choose', { category })}</SheetTitle>
      {listed && (
        <Stamp className="static mx-auto mt-3.5 table text-[1.125rem]">
          {categoryPage('stamp')}
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
        <p
          className={cn(
            'mt-2.5 text-center text-muted-foreground',
            line.size === 'small' ? 'text-sm' : 'text-base',
          )}
        >
          {line.text}
        </p>
      )}
      {judged && (listed || state.kind === 'past-the-end') && (
        <TheSwitch
          on={query.showAll}
          address={addressAt(switchedTo(query, !query.showAll))}
          words={t('switch', { category })}
          nameOn={t('switchOn')}
        />
      )}
      <ChoicesOn
        category={category}
        query={query}
        offered={offered}
        withClearAll={listed}
        list={pickerAddress(language, category)}
      />
      <CategoryDrawing category={category} />
      {holds}
    </Sheet>
  );
}
