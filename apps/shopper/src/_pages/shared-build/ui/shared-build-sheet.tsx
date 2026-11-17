import type {
  BuildPartResponse,
  BuildResponse,
  SharedBuildResponse,
} from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';

import { aroundIt, type Category, theCore } from '@/entities/category';
import { Sheet, sheetGroup, sheetGroupHeading, SheetTitle, Stamp } from '@/shared/ui';
import { BuildStatus, PartLine, statusOf } from '@/widgets/build-quote';

import { whenShared } from '../model/when-shared';
import { TheLinkOnTheSheet } from './what-the-reader-can-do';

// A Shared Build's sheet (DESIGN.md's The Shared Build page, Its sheet): the
// Build's sheet titled "A shared Build" as the page's `h1`; under it the
// stamp of the day it was shared, "Shared 5 Nov 2026", at every width, as
// the picker's stamp stands; then the status as on the Build page, its
// Categories as words and not links; then, in Body Soft Ink, at most 34rem
// wide, when it was shared and that its Parts are fixed and its prices
// today's, and, when some of its Parts have left the catalog since, how
// many, counted from its values against the Parts the API answers; under
// it the link and what else its reader can do (`TheLinkOnTheSheet`). Then its
// Categories as on the Build page, in the home page's two groups, each Part
// with its photo, name, price and second line, a kit's or a drive's
// quantity in its second line, and no form that changes it; a Category it
// does not hold is left out, and so is a group that holds none. Then, when a
// price on it is converted, what "≈" means. It is on the first screen, so
// it prints as the page opens and its stamp lands (Motion 12).
export async function SharedBuildSheet({
  shared,
  answer,
  isYours,
}: {
  shared: SharedBuildResponse;
  answer: BuildResponse;
  // Whether the browser holds this very Build.
  isYours: boolean;
}) {
  const [language, t, groups, categoryPage] = await Promise.all([
    getLocale(),
    getTranslations('SharedBuildPage'),
    getTranslations('HomePage.categories'),
    getTranslations('CategoryPage'),
  ]);
  const status = statusOf(answer, language, 'shared');
  const when = whenShared(language, shared);
  const left = shared.part.length - answer.parts.length;
  const converted = answer.parts.some(
    (part) => part.lowestPrice?.timesQuantity.converted === true,
  );

  const group = (heading: string, categories: readonly Category[]) => {
    const held = categories.filter((category) =>
      answer.parts.some((part) => part.category === category),
    );
    if (held.length === 0) return null;
    return (
      <section className={cn(sheetGroup, 'mt-group grid grid-cols-[minmax(0,1fr)] gap-6')}>
        <h2 className={sheetGroupHeading}>{heading}</h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-6">
          {held.map((category) => (
            <CategoryHeld
              key={category}
              category={category}
              parts={answer.parts.filter((part) => part.category === category)}
              firstPlace={answer.parts.findIndex((part) => part.category === category)}
            />
          ))}
        </ul>
      </section>
    );
  };

  return (
    <Sheet print="arrival">
      <SheetTitle as="h1">{t('title')}</SheetTitle>
      <Stamp
        className="static mx-auto mt-3.5 table text-[1.125rem]"
        data={{ 'data-stamp': 'shared' }}
      >
        {when.stamp}
      </Stamp>
      <BuildStatus status={status} linked={false} />
      <p
        data-testid="when-shared"
        className="mx-auto mt-4 max-w-[34rem] text-center text-base text-muted-foreground"
      >
        {`${when.note} ${t('fixed')}`}
        {left > 0 && (
          <>
            {' '}
            <span data-testid="left-the-catalog" data-count={left}>
              {t('leftTheCatalog', { count: left, countText: formatNumber(left) })}
            </span>
          </>
        )}
      </p>
      <TheLinkOnTheSheet sharedBuildId={shared.id} isYours={isYours} />

      {group(groups('theCore'), theCore)}
      {group(groups('aroundIt'), aroundIt)}

      {converted && (
        <p
          data-testid="what-approximately-means"
          className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground"
        >
          {categoryPage('approximately')}
        </p>
      )}
    </Sheet>
  );
}

// A Category the Shared Build holds: the Category's icon at 20 pixels and its
// name, in Body at 600 in Soft Ink, head its place, as on the Build's sheet,
// then each of its Parts' lines, with no control under them.
async function CategoryHeld({
  category,
  parts,
  firstPlace,
}: {
  category: Category;
  parts: readonly BuildPartResponse[];
  firstPlace: number;
}) {
  const categoryName = await getTranslations('Category');

  return (
    <li
      data-testid={`build-category-${category}`}
      className="@container grid grid-cols-[minmax(0,1fr)] gap-2"
    >
      <h3 className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
        <CategoryIcon category={category} size={20} className="shrink-0" />
        <span>{categoryName(category)}</span>
      </h3>
      {parts.map((part, at) => (
        <div
          key={part.id}
          data-testid="build-part"
          data-part={part.id}
          className="grid grid-cols-[minmax(0,1fr)]"
        >
          <PartLine part={part} place={firstPlace + at} quantityShown />
        </div>
      ))}
    </li>
  );
}
