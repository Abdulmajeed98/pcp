import type { VisiblePartPageResponse, VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category';
import { ListedPart } from '@/entities/part';
import {
  ChoicesOn,
  type CategoryQuery,
  categoryPageAddress,
} from '@/features/search-parts';
import {
  buttonVariants,
  CategoryDrawing,
  Sheet,
  SheetClose,
  SheetGroup,
  SheetTitle,
  Stamp,
} from '@/shared/ui';

import { whatTheSheetShows } from '../model/what-the-sheet-shows';
import { Paging } from './paging';

// A Category's sheet on its page (DESIGN.md's A Category page): the printed
// sheet, its title the Category's name as the page's `h1`, then the page's
// one sentence of what it shows, in Body large in the Ink, as the not-found
// page's note is, since it is what the page says; the choices that are on,
// the Category's drawing, and the list, in BRW-1's order as the API answers
// it: under "In stock" the Parts some Vendor has in stock, lowest price
// first, then under "Out of stock at every Vendor" the rest, each marked so.
// Paging and the closing line follow, in Small Soft Ink, and under it, in
// Body, what "≈" means when a price on the page is converted. The stamp says
// "Lowest price first", in the sheet's end corner when the sheet holds 30rem
// inside its padding, and under its title on a narrower one, as beside the
// swing tag at 1024 pixels and on a phone, so that it never runs into a
// long title. It is on the first screen, so it prints as the page opens.
//
// A sheet that lists nothing says why, and the two empty lists are told
// apart in words (DESIGN.md's The empty states): a Category no Vendor offers
// yet leads to the other Categories, and a search that found nothing offers
// to clear it. A page past the last leads to the first, and a list the API
// did not answer offers to try again.
//
// The sentence under the title is where the sheet says what it shows, so it
// is the page's status (`output`): drawn again in place with script, its new
// words are read to a screen reader without moving the focus.
export async function CategorySheet({
  category,
  query,
  page,
  className,
}: {
  category: Category;
  query: CategoryQuery;
  page: VisiblePartPageResponse | undefined;
  className?: string;
}) {
  const [language, t, searchWords, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('CategoryPage'),
    getTranslations('SearchParts'),
    getTranslations('Category'),
  ]);
  const state = whatTheSheetShows(page, query);
  const addressAt = (at: CategoryQuery) => categoryPageAddress(language, category, at);

  const sentence = (() => {
    switch (state.kind) {
      case 'listed':
        return t(query.search === '' ? 'note' : 'found', {
          count: state.page.totalElements,
          countText: formatNumber(state.page.totalElements),
        });
      case 'none-yet':
        return t('noneYet', { category });
      case 'no-match':
        return t('noMatch', { category });
      case 'past-the-end':
        return t('pastTheEnd', {
          pages: state.totalPages,
          pagesText: formatNumber(state.totalPages),
        });
      case 'not-read':
        return t('notRead');
    }
  })();

  return (
    <Sheet
      print="arrival"
      className={cn('@container', className)}
      frameClassName="lg:col-span-7 lg:max-w-none"
    >
      <SheetTitle as="h1">{categoryName(category)}</SheetTitle>
      {state.kind === 'listed' && (
        <Stamp className="static mx-auto mt-3.5 table text-[1.125rem] @[30rem]:absolute @[30rem]:end-[22px] @[30rem]:top-[26px] @[30rem]:mt-0">
          {t('stamp')}
        </Stamp>
      )}
      <output
        data-testid="sheet-says"
        data-state={state.kind}
        className={cn(
          'mx-auto mt-4 block text-center text-lg text-balance',
          state.kind === 'listed' ? 'max-w-[34ch]' : 'max-w-[26ch]',
        )}
      >
        {sentence}
      </output>
      {state.kind === 'none-yet' && (
        <p className="mt-2.5 text-center text-sm text-muted-foreground">
          {t('noneYetLine')}
        </p>
      )}
      <ChoicesOn category={category} query={query} withClearAll={state.kind === 'listed'} />
      <CategoryDrawing category={category} />

      {state.kind === 'listed' && (
        <>
          <TheList parts={state.page.content} />
          <Paging category={category} query={query} totalPages={state.page.totalPages} />
          <SheetClose>{t('close')}</SheetClose>
          {state.page.content.some((part) => part.lowestPrice?.converted === true) && (
            <p
              data-testid="what-approximately-means"
              className="mx-auto mt-3 max-w-[34rem] text-center text-muted-foreground"
            >
              {t('approximately')}
            </p>
          )}
        </>
      )}
      {state.kind === 'none-yet' && (
        <Action
          kind="board"
          address={`/${language}#categories`}
          plain
          testId="choose-another-category"
        >
          {t('chooseAnotherCategory')}
        </Action>
      )}
      {state.kind === 'no-match' && (
        <Action
          kind="primary"
          address={addressAt({ search: '', page: 1 })}
          testId="clear-all"
        >
          {searchWords('clearAll')}
        </Action>
      )}
      {state.kind === 'past-the-end' && (
        <Action
          kind="primary"
          address={addressAt({ ...query, page: 1 })}
          testId="to-the-first-page"
        >
          {t('toTheFirstPage')}
        </Action>
      )}
      {state.kind === 'not-read' && (
        <Action kind="board" address={addressAt(query)} testId="try-again">
          {t('tryAgain')}
        </Action>
      )}
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
            <ListedPart key={part.id} part={part} place={place} />
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
            <ListedPart key={part.id} part={part} place={inStock.length + place} />
          ))}
        </SheetGroup>
      )}
    </>
  );
}

// The one way out of a sheet that lists nothing, centred under its drawing,
// 52 pixels tall: a cell, or the sheet's primary button. A way back into the
// list draws it again in place with script; the way to the other
// Categories (`plain`) opens the home page anew.
function Action({
  kind,
  address,
  plain = false,
  testId,
  children,
}: {
  kind: 'primary' | 'board';
  address: string;
  plain?: boolean;
  testId?: string;
  children: ReactNode;
}) {
  const className = buttonVariants({ kind, className: 'mx-auto mt-8 flex w-fit' });
  return plain ? (
    <a href={address} data-testid={testId} className={className}>
      {children}
    </a>
  ) : (
    <Link href={address} prefetch={false} data-testid={testId} className={className}>
      {children}
    </Link>
  );
}
