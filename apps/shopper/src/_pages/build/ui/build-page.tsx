import type { BuildResponse } from '@pcp/api-client';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

import { buildAddress, buildIn, writeTheBuild } from '@/entities/build';
import { ChangesInPlace, refusalIn } from '@/features/change-the-build';
import { chosenCurrency } from '@/shared/currency';
import { type Photograph, photographs } from '@/shared/photographs';
import { type AddressQuery, fieldsOf } from '@/shared/lib';
import { DimPhotograph, NotRead } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readTheBuildPage } from '../api/read-the-build-page';
import { statusOf } from '../model/status';
import { BuildSheet } from './build-sheet';
import { BuildSlip } from './build-slip';
import { RulesSheet } from './rules-sheet';
import { VendorsSheet } from './vendors-sheet';

// The Build page, at `/<language>/build` (DESIGN.md's The Build page): the
// stub, its way to the Build marked as the page the Shopper is on; then,
// over a dim photograph of a built PC, the Build's till slip beside the
// Build's sheet, centred and 56 pixels apart, the slip pinned from 64rem,
// and below 64rem the slip first, then the sheet; then the rules' sheet,
// centred over a dim photograph of a board; then the sheet of the Vendors,
// centred over the dim photograph of a water-cooled PC; the back cover. An
// empty Build has its slip and its sheet, and no rules' sheet and no
// Vendors; a Build no Vendor stocks any Part of has no Vendors' sheet.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency, from the Build its cookie holds and what the API
// answers of it then. A change past the limits is said where it was refused,
// as the address after it says (`refusalIn`). A Build the API did not answer
// shows the sheet that says it cannot be read just now, with Try again, and
// its cookie is left as it is. Every piece the API's answer fills is drawn
// again in place by a change with script (Motion 11).
export async function BuildPage({ searchParams }: { searchParams: Promise<AddressQuery> }) {
  const [address, language, currency, sent, t] = await Promise.all([
    searchParams,
    getLocale(),
    chosenCurrency(),
    cookies(),
    getTranslations('BuildPage'),
  ]);
  const build = buildIn(sent);
  const answer = await readTheBuildPage(build, currency);
  const refused = refusalIn(new URLSearchParams(fieldsOf(address)));

  return (
    <>
      <Stub onTheBuildPage />
      {answer === undefined ? (
        <NotRead
          photograph={photographs.builtPc}
          title={t('notRead.title')}
          note={t('notRead.note')}
          tryAgain={t('tryAgain')}
          address={buildAddress(language)}
        />
      ) : (
        // The page's own column between the stub and the back cover, a box
        // of its own, so that each of its sections reads as one, as a
        // reader and Taste's inspector take a page's sections.
        <ChangesInPlace drawnFor={writeTheBuild(build)} className="flex flex-1 flex-col">
          <main className="relative isolate flex-1 px-ground-edge py-section-phone md:page-margins md:py-section">
            <DimPhotograph photograph={photographs.builtPc} first />
            <div className="mx-auto grid w-full max-w-[40rem] grid-cols-[minmax(0,1fr)] justify-items-center gap-y-10 lg:max-w-none lg:grid-cols-[minmax(0,23rem)_minmax(0,40rem)] lg:items-start lg:justify-center lg:gap-x-14">
              <BuildSlip answer={answer} stamped={statusOf(answer, language).stamped} />
              <BuildSheet answer={answer} refused={refused} />
            </div>
          </main>
          {answer.parts.length > 0 && <RulesSheet answer={answer} />}
          {answer.vendors.length > 0 && <VendorsSheet answer={answer} />}
        </ChangesInPlace>
      )}
      <BackCover photographs={photographsOf(answer)} />
    </>
  );
}

// The photographs the page lays its pieces on, in their order, which its
// back cover credits: the built PC under the slip and the Build's sheet, the
// board under the rules' sheet and the water-cooled PC under the Vendors'.
function photographsOf(answer: BuildResponse | undefined): Photograph[] {
  if (answer === undefined) return [photographs.builtPc];
  return [
    photographs.builtPc,
    ...(answer.parts.length > 0 ? [photographs.motherboardCloseup] : []),
    ...(answer.vendors.length > 0 ? [photographs.waterCooledPc] : []),
  ];
}
