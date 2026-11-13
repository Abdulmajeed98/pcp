import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { buildIn } from '@/entities/build';
import { categoryOfTheAddress } from '@/entities/category';
import { pickerAddress } from '@/features/change-the-build';
import {
  type AddressQuery,
  addressOfTheForm,
  readPickerQuery,
  readPriceRange,
  readTheFilters,
  Search,
} from '@/features/search-parts';
import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, MarkADrawingAgain } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readThePickersList } from '../api/read-the-picker';
import type { PickerPageParams } from '../model/preview';
import { whatThePickerShows } from '../model/what-the-picker-shows';
import { PickerSheet } from './picker-sheet';

// The picker, at `/<language>/build/<category>` (DESIGN.md's The picker, and
// Layout's The picker): a Category page's composition, the stub; then, over
// the same dim photograph of a board, the swing tag of the Category's search
// and filters beside the picker's sheet, from 64rem in columns 1 to 5 and 6
// to 12, and below 64rem the search, the fold of the filters, then the
// sheet; the back cover.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency, with the Build from the Shopper's cookie (BLD-2,
// BLD-3). It reads the Category's filters in stock only first, and then its
// list for the search, the filters, the price range, the switch and the page
// its address holds, read against what the filters offer, so that the
// filters offer only what Parts in stock hold and nothing they do not offer
// is ever sent. Without the filters' answer the list is not asked: the sheet
// says it cannot be read, and Try again leads to the same address. An address
// that names no Category answers the "not found" page with the status 404, in
// the page's language.
export async function PickerPage({
  params,
  searchParams,
}: PickerPageParams & { searchParams: Promise<AddressQuery> }) {
  const category = categoryOfTheAddress((await params).category);
  if (category === undefined) notFound();

  const [address, currency, language, sent] = await Promise.all([
    searchParams,
    chosenCurrency(),
    getLocale(),
    cookies(),
  ]);
  const build = buildIn(sent);
  const judged = build.length > 0;
  const offered = await readTheFilters(category, currency, { inStockOnly: true });
  const query = readPickerQuery(address, offered);
  const page =
    offered === undefined
      ? undefined
      : await readThePickersList(category, query, currency, build);
  const list = pickerAddress(language, category);
  const asAsked = addressOfTheForm(
    list,
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
            list={list}
            className="lg:col-span-5"
          />
          <PickerSheet
            category={category}
            query={query}
            offered={offered}
            state={whatThePickerShows(page, query)}
            build={build}
            judged={judged}
            asAsked={asAsked}
          />
        </div>
      </main>
      <BackCover photographs={[photographs.motherboardCloseup]} />
    </>
  );
}
