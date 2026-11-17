import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress } from '@/entities/build';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, Sheet, SheetAction, SheetTitle } from '@/shared/ui';

// A Shared Build whose Parts have all left the catalog (DESIGN.md's The
// Shared Build page): no slip, no rules, no Vendors, no copy and no link,
// one sheet, centred over the dim photograph of a built PC, as the not-found
// page is, titled "A shared Build" as the page's `h1`, saying in Body large
// that none of its Parts is in the catalog any more, so there is nothing to
// show or copy, then when it was shared in Body Soft Ink, and "Start your
// own Build", a cell of the Board, to the Build page.
export async function AllGone({ parts, when }: { parts: number; when: string }) {
  const [language, t] = await Promise.all([
    getLocale(),
    getTranslations('SharedBuildPage'),
  ]);

  return (
    <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
      <DimPhotograph photograph={photographs.builtPc} first />
      <Sheet print="arrival">
        <div data-testid="all-gone" className="contents">
          <SheetTitle as="h1">{t('title')}</SheetTitle>
          <p className="mx-auto mt-4 max-w-[34ch] text-center text-lg text-balance">
            {t('allGone.sentence', { count: parts, countText: formatNumber(parts) })}
          </p>
          <p
            data-testid="when-shared"
            className="mx-auto mt-2.5 max-w-[34rem] text-center text-base text-muted-foreground"
          >
            {when}
          </p>
          <SheetAction
            kind="board"
            address={buildAddress(language)}
            plain
            testId="start-your-own"
          >
            {t('allGone.start')}
          </SheetAction>
        </div>
      </Sheet>
    </main>
  );
}
