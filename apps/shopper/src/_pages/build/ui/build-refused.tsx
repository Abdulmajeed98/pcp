import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress } from '@/entities/build';
import { EmptyTheBuild } from '@/features/change-the-build';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, Sheet, SheetNote, SheetTitle } from '@/shared/ui';

// A Build the API refuses (DESIGN.md's A Build the API refuses): one sheet,
// centred over the dim photograph of a built PC, as a Build the API does not
// answer is, that says the Build cannot be read, as its title and the page's
// `h1`, and why, and offers Empty the Build with its one confirmation, which
// counts the Parts its cookie names, in place of Try again, which would only
// be refused again (the owner's answer of 13 November 2026). Only a cookie
// edited by hand makes it, such as one that files a RAM kit under the CPU.
export async function BuildRefused({ count }: { count: number }) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('BuildPage')]);
  const counted = { count, countText: formatNumber(count) };

  return (
    <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
      <DimPhotograph photograph={photographs.builtPc} first />
      <Sheet print="arrival">
        <div data-testid="build-refused" className="contents">
          <SheetTitle as="h1">{t('notReadable.title')}</SheetTitle>
          <SheetNote lead>{t('notReadable.note')}</SheetNote>
          <EmptyTheBuild
            action={`${buildAddress(language)}/empty`}
            buildAddress={buildAddress(language)}
            words={{
              cell: t('empty.cell'),
              warning: t('empty.warning', counted),
              confirm: t('empty.confirm', counted),
              keep: t('empty.keep', counted),
            }}
          />
        </div>
      </Sheet>
    </main>
  );
}
