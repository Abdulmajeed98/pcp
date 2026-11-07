import { CategoryIcon } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import { categories, categoryAddress } from '@/entities/category';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, Item, Sheet, SheetGroup, SheetNote, SheetTitle } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

// The "not found" page (DESIGN.md's The not-found page), in the visitor's
// language: the stub, then one sheet centred over a dim photograph, its
// title the page's `h1`, a note in words a Shopper uses, and under Choose a
// Category the eight Categories as items, each its icon and its name as a
// link to its Category page, in the catalog's order, with no count and no
// price, so that the page needs nothing from the API; then the back cover
// with its credit. When a route asks for it, Next answers with the status
// 404. Its sheet is on the first screen, so it prints as the page opens.
export async function NotFoundPage() {
  const [language, t, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('NotFoundPage'),
    getTranslations('Category'),
  ]);

  return (
    <>
      <Stub />
      <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
        <DimPhotograph photograph={photographs.builtPc} first />
        <Sheet print="arrival">
          <SheetTitle as="h1">{t('title')}</SheetTitle>
          <SheetNote lead>{t('description')}</SheetNote>
          <SheetGroup heading={t('chooseACategory')} as="h2">
            {categories.map((category) => (
              <Item
                key={category}
                testId={`category-${category}`}
                icon={
                  <CategoryIcon category={category} size={20} className="text-foreground" />
                }
                name={
                  <a href={categoryAddress(language, category)} className="hover-underline">
                    {categoryName(category)}
                  </a>
                }
              />
            ))}
          </SheetGroup>
        </Sheet>
      </main>
      <BackCover photographs={[photographs.builtPc]} />
    </>
  );
}
