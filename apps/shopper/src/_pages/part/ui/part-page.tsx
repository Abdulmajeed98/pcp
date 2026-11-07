import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { partAddress } from '@/entities/part';
import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { NotRead } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readThePartPage } from '../api/read-the-part-page';
import type { PartPageParams } from '../model/preview';
import { Offers } from './offers';
import { PartPlate } from './part-plate';
import { Specifications } from './specifications';

// A Part page, at `/<language>/parts/<partId>` (DESIGN.md's A Part page,
// BRW-3): the stub; the square plate, the Part's photo or its Category's
// icon beside its name, part numbers and Lowest Price; its Offers, the price
// slip beside the sheet of every Visible Offer; its specifications, the box
// label and every specification it holds; the back cover, with the
// photographs the page lies on.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency, from what the API answers then. A Part that is not
// visible, an unknown one, and one whose Offers are gone by the time they are
// asked for answer the "not found" page with the status 404, in the page's
// language; a Part the API did not answer says it cannot be read just now.
export async function PartPage({ params }: PartPageParams) {
  const [{ partId }, currency, language, t] = await Promise.all([
    params,
    chosenCurrency(),
    getLocale(),
    getTranslations('PartPage'),
  ]);
  const reading = await readThePartPage(partId, currency);
  if (reading.kind === 'not-found') notFound();

  return (
    <>
      <Stub />
      {reading.kind === 'not-read' ? (
        <NotRead
          photograph={photographs.handSettingMemory}
          title={t('notRead.title')}
          note={t('notRead.note')}
          tryAgain={t('tryAgain')}
          address={partAddress(language, partId)}
        />
      ) : (
        <main className="flex-1">
          <PartPlate part={reading.part} offers={reading.offers} />
          <Offers part={reading.part} offers={reading.offers} figures={reading.figures} />
          <Specifications part={reading.part} />
        </main>
      )}
      <BackCover
        photographs={
          reading.kind === 'not-read'
            ? [photographs.handSettingMemory]
            : [photographs.handSettingMemory, photographs.memoryChips]
        }
      />
    </>
  );
}
