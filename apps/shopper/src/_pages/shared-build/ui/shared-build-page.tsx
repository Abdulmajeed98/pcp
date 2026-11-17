import type { BuildResponse } from '@pcp/api-client';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { buildIn, holdsTheSharedBuild, partsCountedIn } from '@/entities/build';
import { sharedBuildAddress } from '@/entities/shared-build';
import { refusedCopyIn } from '@/features/copy-a-shared-build';
import { chosenCurrency } from '@/shared/currency';
import { type AddressQuery, fieldsOf } from '@/shared/lib';
import { type Photograph, photographs } from '@/shared/photographs';
import { DimPhotograph, NotRead } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { BuildSlip, RulesSheet, statusOf, VendorsSheet } from '@/widgets/build-quote';
import { Stub } from '@/widgets/frame-header';

import { readTheSharedBuildPage } from '../api/read-the-shared-build-page';
import { whenShared } from '../model/when-shared';
import { AllGone } from './all-gone';
import { SharedBuildSheet } from './shared-build-sheet';
import { TheSlipsAction } from './what-the-reader-can-do';

// The Shared Build page, at `/<language>/builds/<sharedBuildId>` (DESIGN.md's
// The Shared Build page), the page a Shared Build's link opens: the Build
// page's quote with no form that changes it, drawn by the same pieces, and
// stamped with the day it was shared. The stub, its way to the Build leading
// to the reader's own Build; then, over a dim photograph of a built PC, the
// Shared Build's till slip beside its sheet, the slip pinned from 64rem and
// first on a phone, 24 pixels above the sheet, carrying its reader's one action right under its price
// lines, and the sheet the link and the rest its reader can do under its
// note; then the rules' sheet and the Vendors' sheet over their
// photographs; the back cover. Its words speak of the Build as the
// sender's, never the reader's.
//
// It is drawn on the server for each request, in the language of its
// address, which is its sender's (ADR-0008), and the chosen currency, from
// the Shared Build's frozen Parts and what the API answers of them today,
// so its prices, both price views, its outcomes, its status and its power
// draw are today's (SHR-2). The browser's own Build, read from its cookie, is
// compared with the Shared Build: the same Build is told so and offered no
// copy. A Shared Build that does not exist answers the not-found page with
// 404; one whose Parts have all left the catalog says so on one sheet, with
// nothing to copy; and one the API did not answer shows the sheet that says
// it cannot be read just now, with Try again.
export async function SharedBuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; sharedBuildId: string }>;
  searchParams: Promise<AddressQuery>;
}) {
  const [{ sharedBuildId }, address, language, currency, sent, t, buildWords] =
    await Promise.all([
      params,
      searchParams,
      getLocale(),
      chosenCurrency(),
      cookies(),
      getTranslations('SharedBuildPage'),
      getTranslations('BuildPage'),
    ]);
  const read = await readTheSharedBuildPage(sharedBuildId, currency);
  if (read.kind === 'not-found') notFound();
  const answer = read.kind === 'read' ? read.answer : undefined;
  const own = buildIn(sent);
  const isYours = read.kind === 'read' && holdsTheSharedBuild(own, read.shared.part);

  return (
    <>
      <Stub />
      {read.kind === 'not-read' ? (
        <NotRead
          photograph={photographs.builtPc}
          title={t('notRead.title')}
          note={t('notRead.note')}
          tryAgain={buildWords('tryAgain')}
          address={sharedBuildAddress(language, sharedBuildId)}
        />
      ) : read.answer.parts.length === 0 ? (
        <AllGone
          parts={read.shared.part.length}
          when={whenShared(language, read.shared.sharedAt, read.readAt).note}
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <main className="relative isolate flex-1 px-ground-edge py-section-phone md:page-margins md:py-section">
            <DimPhotograph photograph={photographs.builtPc} first />
            <div className="mx-auto grid w-full max-w-[40rem] grid-cols-[minmax(0,1fr)] justify-items-center gap-y-6 lg:max-w-none lg:grid-cols-[minmax(0,23rem)_minmax(0,40rem)] lg:items-start lg:justify-center lg:gap-x-14">
              <BuildSlip
                answer={read.answer}
                stamped={statusOf(read.answer, language, 'shared').stamped}
                whose="shared"
                actionNeedsScript={isYours}
              >
                <TheSlipsAction
                  sharedBuildId={read.shared.id}
                  parts={partsCountedIn(read.answer.parts)}
                  ownParts={partsCountedIn(own)}
                  isYours={isYours}
                  refused={refusedCopyIn(new URLSearchParams(fieldsOf(address)))}
                />
              </BuildSlip>
              <SharedBuildSheet
                shared={read.shared}
                answer={read.answer}
                now={read.readAt}
                isYours={isYours}
              />
            </div>
          </main>
          <RulesSheet answer={read.answer} whose="shared" />
          {read.answer.vendors.length > 0 && (
            <VendorsSheet answer={read.answer} whose="shared" />
          )}
        </div>
      )}
      <BackCover photographs={photographsOf(answer)} />
    </>
  );
}

// The photographs the page lays its pieces on, in their order, which its
// back cover credits: the built PC under the slip and the sheet, the board
// under the rules' sheet and the water-cooled PC under the Vendors'.
function photographsOf(answer: BuildResponse | undefined): Photograph[] {
  if (answer === undefined || answer.parts.length === 0) return [photographs.builtPc];
  return [
    photographs.builtPc,
    photographs.motherboardCloseup,
    ...(answer.vendors.length > 0 ? [photographs.waterCooledPc] : []),
  ];
}
