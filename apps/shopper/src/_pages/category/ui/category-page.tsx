import { notFound } from 'next/navigation';

import { categoryOfTheAddress } from '@/entities/category';
import { type AddressQuery, readCategoryQuery, Search } from '@/features/search-parts';
import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, MarkADrawingAgain } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readTheCategoryPage } from '../api/read-the-category-page';
import type { CategoryPageParams } from '../model/preview';
import { CategorySheet } from './category-sheet';

// A Category page, at `/<language>/categories/<category>` (DESIGN.md's A
// Category page): the stub; then, over a dim photograph of a board, the
// search and the Category's sheet of its Visible Parts, side by side from
// 64rem, the search as the swing tag in columns 1 to 5 and the sheet in 6 to
// 12, and below 64rem the search above the sheet; the back cover.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency, from the search and the page its address holds,
// which the API answers then. An address that names no Category answers the
// "not found" page with the status 404, in the page's language.
export async function CategoryPage({
  params,
  searchParams,
}: CategoryPageParams & { searchParams: Promise<AddressQuery> }) {
  const category = categoryOfTheAddress((await params).category);
  if (category === undefined) notFound();

  const [query, currency] = await Promise.all([
    searchParams.then(readCategoryQuery),
    chosenCurrency(),
  ]);
  const page = await readTheCategoryPage(category, query, currency);

  return (
    <>
      <MarkADrawingAgain />
      <Stub />
      <main className="relative isolate flex-1 px-ground-edge py-section-phone md:page-margins md:py-section">
        <DimPhotograph photograph={photographs.motherboardCloseup} first />
        <div className="mx-auto grid w-full max-w-[40rem] grid-cols-[minmax(0,1fr)] items-start gap-y-2.5 lg:max-w-none lg:grid-cols-12 lg:gap-x-6">
          <Search category={category} query={query} className="lg:col-span-5" />
          <CategorySheet category={category} query={query} page={page} />
        </div>
      </main>
      <BackCover photographs={[photographs.motherboardCloseup]} />
    </>
  );
}
