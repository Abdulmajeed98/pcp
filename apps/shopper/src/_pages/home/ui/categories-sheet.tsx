import type { PlatformFiguresResponse, VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, CategoryIcon } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import {
  aroundIt,
  categories,
  type Category,
  categoryAddress,
  theCore,
} from '@/entities/category';
import { photographs } from '@/shared/photographs';
import { ShownPrice } from '@/shared/price';
import {
  DimPhotograph,
  HeatSinkDrawing,
  Item,
  Sheet,
  SheetClose,
  SheetGroup,
  SheetNote,
  SheetTitle,
  TearOffTabs,
} from '@/shared/ui';

import type { FirstPage } from '../model/the-plates-part';

// The sheet of the eight Categories (DESIGN.md's A Category on the home page),
// centred over a dim photograph of a built PC: in two groups, the core of a
// PC and what goes around it, in the catalog's fixed order, each Category an
// item with its icon, its name in the Shopper's language as a link to its
// Category page, the leader, and at the end how many Visible Parts it has; on
// its second line the first Part of its list and that Part's Lowest Price,
// the lowest on the platform. Each figure is there only where the API
// answered it. The sheet ends with the Categories as eight tear-off tabs.
//
// It is below the first screen, so it prints as it comes into view, its
// counts settling into their column (Motions 1 and 2).
export async function CategoriesSheet({
  firstPages,
  figures,
}: {
  firstPages: readonly FirstPage[];
  figures: PlatformFiguresResponse | undefined;
}) {
  const [language, t, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('HomePage'),
    getTranslations('Category'),
  ]);
  const pageOf = (category: Category) =>
    firstPages.find((each) => each.category === category)?.page;

  // A Category's item, at its place on the sheet.
  const item = (category: Category, place: number) => {
    const page = pageOf(category);
    const first = page?.content.at(0);
    return (
      <Item
        key={category}
        testId={`category-${category}`}
        place={place}
        icon={<CategoryIcon category={category} size={20} className="text-foreground" />}
        name={
          <a href={categoryAddress(language, category)} className="hover-underline">
            {categoryName(category)}
          </a>
        }
        end={
          page === undefined
            ? undefined
            : t('categories.parts', {
                count: page.totalElements,
                countText: formatNumber(page.totalElements),
              })
        }
        second={first === undefined ? undefined : <FirstPart part={first} />}
      />
    );
  };

  // The first Part of a Category's list, with its Lowest Price, or the words
  // that say every Vendor has it out of stock.
  function FirstPart({ part }: { part: VisiblePartResponse }) {
    return (
      <>
        <AlwaysEnglish>{part.name}</AlwaysEnglish>
        {part.lowestPrice !== null ? (
          <>
            {' · '}
            {t('categories.lowestPrice')} <ShownPrice price={part.lowestPrice} />
          </>
        ) : (
          !part.inStock && <> · {t('categories.outOfStockEverywhere')}</>
        )}
      </>
    );
  }

  return (
    <section
      id="categories"
      aria-labelledby="categories-title"
      className="relative isolate grid scroll-mt-4 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section"
    >
      {/* The home page opens here at `#categories`, from a Category with
          no Visible Part, and its photograph is then the first screen's. */}
      <DimPhotograph photograph={photographs.builtPc} atOnce />
      <Sheet print="in-view">
        <SheetTitle id="categories-title">{t('eightCategories')}</SheetTitle>
        <SheetNote>{t('categories.note')}</SheetNote>
        <HeatSinkDrawing />
        <SheetGroup heading={t('categories.theCore')}>
          {theCore.map((category, place) => item(category, place))}
        </SheetGroup>
        <SheetGroup heading={t('categories.aroundIt')}>
          {aroundIt.map((category, place) => item(category, theCore.length + place))}
        </SheetGroup>
        {figures !== undefined && (
          <SheetClose>
            {t('categories.close', {
              days: figures.daysAnOfferStaysCurrent,
              daysText: formatNumber(figures.daysAnOfferStaysCurrent),
            })}
          </SheetClose>
        )}
        <TearOffTabs
          label={t('categories.tabs')}
          perRowOnAPhone={4}
          tabs={categories.map((category) => ({
            address: categoryAddress(language, category),
            name: categoryName(category),
          }))}
        />
      </Sheet>
    </section>
  );
}
