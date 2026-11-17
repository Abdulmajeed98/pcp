import type { BuildResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress, partsCountedIn, type Refusal } from '@/entities/build';
import { aroundIt, type Category, theCore } from '@/entities/category';
import { EmptyTheBuild } from '@/features/change-the-build';
import { Sheet, sheetGroup, sheetGroupHeading, SheetTitle } from '@/shared/ui';
import { BuildStatus, statusOf } from '@/widgets/build-quote';

import { CategoryPlace } from './category-place';

// The Build's sheet (DESIGN.md's The Build's sheet): the printed sheet, its
// title "Your Build" in the Sheet title as the page's `h1`; under it the
// status; then the eight Categories in the catalog's order, in the home
// page's two groups under their Labels, "The core" and "Around it", 24
// pixels between Categories; then Empty the Build, which an empty Build has
// not; then, when a price on it is converted, what "≈" means, in Body Soft
// Ink. It is on the first screen, so it prints as the page opens (Motion 1).
export async function BuildSheet({
  answer,
  refused,
}: {
  answer: BuildResponse;
  refused: Refusal | undefined;
}) {
  const [language, t, groups, categoryPage] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage'),
    getTranslations('HomePage.categories'),
    getTranslations('CategoryPage'),
  ]);
  const status = statusOf(answer, language);
  const count = partsCountedIn(answer.parts);
  const converted = answer.parts.some(
    (part) => part.lowestPrice?.timesQuantity.converted === true,
  );

  const places = (categories: readonly Category[]) =>
    categories.map((category) => {
      const parts = answer.parts.filter((part) => part.category === category);
      // The place of the Category's first Part on the sheet, which staggers
      // its price as the sheet prints (Motion 2): the API answers the Parts
      // in the catalog's order of Categories, the sheet's own.
      const firstPlace = Math.max(
        0,
        answer.parts.findIndex((part) => part.category === category),
      );
      return (
        <CategoryPlace
          key={category}
          category={category}
          parts={parts}
          firstPlace={firstPlace}
          notNeeded={
            parts.length === 0 &&
            answer.parts.length > 0 &&
            !answer.stillNeeded.includes(category)
          }
          refused={refused}
        />
      );
    });

  return (
    <Sheet print="arrival">
      <SheetTitle as="h1">{t('title')}</SheetTitle>
      <BuildStatus status={status} />

      <section className={cn(sheetGroup, 'mt-group grid grid-cols-[minmax(0,1fr)] gap-6')}>
        <h2 className={sheetGroupHeading}>{groups('theCore')}</h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-6">{places(theCore)}</ul>
      </section>
      <section className={cn(sheetGroup, 'mt-group grid grid-cols-[minmax(0,1fr)] gap-6')}>
        <h2 className={sheetGroupHeading}>{groups('aroundIt')}</h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-6">{places(aroundIt)}</ul>
      </section>

      {/* Its space folds when a Remove in place leaves the Build empty, or
          the last converted price. */}
      <div data-space="empty" className="grid grid-cols-[minmax(0,1fr)]">
        {count > 0 && (
          <EmptyTheBuild
            action={`/${language}/build/empty`}
            buildAddress={buildAddress(language)}
            words={{
              cell: t('empty.cell'),
              warning: t('empty.warning', { count, countText: formatNumber(count) }),
              confirm: t('empty.confirm', { count, countText: formatNumber(count) }),
              keep: t('empty.keep', { count, countText: formatNumber(count) }),
            }}
          />
        )}
        {converted && (
          <p
            data-testid="what-approximately-means"
            className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground"
          >
            {categoryPage('approximately')}
          </p>
        )}
      </div>
    </Sheet>
  );
}
