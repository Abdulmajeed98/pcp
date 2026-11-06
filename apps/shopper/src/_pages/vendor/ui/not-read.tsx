import { getLocale, getTranslations } from 'next-intl/server';

import { vendorAddress } from '@/entities/vendor';
import { photographs } from '@/shared/photographs';
import { buttonVariants, DimPhotograph, Sheet, SheetNote, SheetTitle } from '@/shared/ui';

// A Vendor page whose Vendor the API did not answer at all: one sheet,
// centred over the dim photograph of the page, that says the Vendor cannot
// be read just now, as its title and the page's `h1`, and offers to try
// again at the same address, as a Part page does. It is not "not found": the
// Vendor may well be there.
export async function NotRead({ vendorId, page }: { vendorId: string; page: number }) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('VendorPage')]);

  return (
    <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
      <DimPhotograph photograph={photographs.waterCooledPc} first />
      <Sheet print="arrival">
        <SheetTitle as="h1">{t('notRead.title')}</SheetTitle>
        <SheetNote lead>{t('notRead.note')}</SheetNote>
        <a
          href={vendorAddress(language, vendorId, page)}
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
