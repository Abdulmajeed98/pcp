import { getLocale, getTranslations } from 'next-intl/server';

import { partAddress } from '@/entities/part';
import { photographs } from '@/shared/photographs';
import { buttonVariants, DimPhotograph, Sheet, SheetNote, SheetTitle } from '@/shared/ui';

// A Part page whose Part or Offers the API did not answer at all: one sheet,
// centred over the dim photograph of the Offers, that says the Part cannot
// be read just now, as its title and the page's `h1`, and offers to try
// again at the same address, as a Category page's list does when the API
// does not answer. It is not "not found": the Part may well be there.
export async function NotRead({ partId }: { partId: string }) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('PartPage')]);

  return (
    <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
      <DimPhotograph photograph={photographs.handSettingMemory} first />
      <Sheet print="arrival">
        <SheetTitle as="h1">{t('notRead.title')}</SheetTitle>
        <SheetNote lead>{t('notRead.note')}</SheetNote>
        <a
          href={partAddress(language, partId)}
          data-testid="try-again"
          className={buttonVariants({
            kind: 'board',
            className: 'mx-auto mt-8 flex w-fit',
          })}
        >
          {t('tryAgain')}
        </a>
      </Sheet>
    </main>
  );
}
