import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { categoryAddress, categoryOfTheAddress } from '@/entities/category';
import {
  type AddressQuery,
  addressOfTheForm,
  readCategoryQuery,
  readPriceRange,
  Search,
} from '@/features/search-parts';
import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, MarkADrawingAgain } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readTheCategoryFilters, readTheCategoryPage } from '../api/read-the-category-page';
import type { CategoryPageParams } from '../model/preview';
import { CategorySheet } from './category-sheet';

// A Category page, at `/<language>/categories/<category>` (DESIGN.md's A
// Category page): the stub; then, over a dim photograph of a board, the
// swing tag of the search and the filters and the Category's sheet of its
// Visible Parts, side by side from 64rem, the tag in columns 1 to 5 and the
// sheet in 6 to 12, and below 64rem the search, the fold of the filters, then
// the sheet; the back cover.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency. It reads the Category's filters first, and then
// its list for the search, the filters, the price range and the page its
// address holds, read against what the filters offer, so that nothing they
// do not offer is ever sent. Without the filters' answer the list is not
// asked: the sheet says it cannot be read, and Try again leads to the same
// address, as it was asked. An address that names no Category answers the
// "not found" page with the status 404, in the page's language.
export async function CategoryPage({
  params,
  searchParams,
}: CategoryPageParams & { searchParams: Promise<AddressQuery> }) {
  const category = categoryOfTheAddress((await params).category);
  if (category === undefined) notFound();

  const [address, currency, language] = await Promise.all([
    searchParams,
    chosenCurrency(),
    getLocale(),
  ]);
  const offered = await readTheCategoryFilters(category, currency);
  const query = readCategoryQuery(address, offered);
  const page =
    offered === undefined
      ? undefined
      : await readTheCategoryPage(category, query, currency);
  const asAsked = addressOfTheForm(
    categoryAddress(language, category),
    Object.entries(address).flatMap(([name, values]) =>
      [values ?? []].flat().map((value) => [name, value] as const),
    ),
  );

  return (
    <>
      <MarkADrawingAgain />
      <Stub />
      <main className="relative isolate flex-1 px-ground-edge py-section-phone md:page-margins md:py-section">
        <DimPhotograph photograph={photographs.motherboardCloseup} first />
        <div className="mx-auto grid w-full max-w-[40rem] grid-cols-[minmax(0,1fr)] items-start gap-y-2.5 lg:max-w-none lg:grid-cols-12 lg:gap-x-6">
          <Search
            category={category}
            query={query}
            offered={offered}
            range={readPriceRange(address, offered)}
            className="lg:col-span-5"
          />
          <CategorySheet
            category={category}
            query={query}
            offered={offered}
            page={page}
            asAsked={asAsked}
          />
        </div>
      </main>
      <BackCover photographs={[photographs.motherboardCloseup]} />
    </>
  );
}
