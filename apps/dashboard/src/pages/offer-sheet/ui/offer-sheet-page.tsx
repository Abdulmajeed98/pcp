import type { Language } from '@pcp/i18n';
import { formatNumber } from '@pcp/i18n';
import { DownloadIcon, FileSpreadsheetIcon } from 'lucide-react';
import { useLocation } from 'react-router';

import { useVendorsOffers } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Announced,
  BusyLabel,
  Button,
  OpeningSpace,
} from '@/shared/ui';

import { useDownloadOfferSheet } from '../api/offer-sheet';
import { useKeptResult } from '../model/kept-result';
import { BusyMark } from './busy-mark';
import { UploadForm } from './upload-form';
import { UploadResult } from './upload-result';

// What the screen is told on the way back from the Part Request form opened
// from a row: the row that was asked for.
export interface AskedForARow {
  asked: number;
}

// The Vendor portal's Offer sheet screen, `offer-sheet`, the portal's second
// section (SHT-1 to SHT-7): download, upload and the upload's result, in the
// portal's language, as the dashboard's DESIGN.md lays it out (the owner's
// d2, taken under the standing instruction of 18 November 2026, sheet
// ticket 03).
//
// Its title and one Note Grey sentence; then the screen's two jobs in one
// column at most 40rem wide, the download above a Rule line and the upload
// below it; from 64rem, on the end side, level with the first, "What the
// file holds" on Raised Stone. The upload's result stands under both, across
// the content's width; on a phone it comes straight after the upload, and
// the panel last. The screen has no search, no action in the phone's bar and
// no plate. Its address is relative to the route, so the frame for acting
// as a Vendor serves it too. On a phone the three stand in a column, whose
// gap above the result the result gives back while its space opens, so that
// the panel below it never moves in one frame; from 64rem they are a grid,
// the result in a row of its own below the other two.
export function OfferSheetPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const kept = useKeptResult(vendorId);
  const asked = (useLocation().state as Partial<AskedForARow> | null)?.asked;

  return (
    <div data-testid="offer-sheet-screen" className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="screen-title">{t('OfferSheetScreen.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('OfferSheetScreen.intro')}</p>
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(16rem,1fr)] lg:items-start">
        <div className="flex max-w-[40rem] min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
          <DownloadSection vendorId={vendorId} />
          <div className="border-t border-rule" />
          <UploadForm vendorId={vendorId} />
        </div>
        {kept !== undefined && (
          <UploadResult
            vendorId={vendorId}
            kept={kept}
            askedNow={asked}
            className="min-w-0 lg:col-span-2 lg:row-start-2"
          />
        )}
        <WhatTheFileHolds />
      </div>
      {/* The note that a row was asked for, on the way back from the form,
          said by a region always in the page (Motion 6). */}
      <output className="sr-only">
        {asked !== undefined && kept !== undefined && (
          <Announced>
            <Trans
              i18nKey="OfferSheetScreen.askedStatus"
              components={{ row: <>{formatNumber(asked)}</> }}
            />
          </Announced>
        )}
      </output>
    </div>
  );
}

// The download: its heading, one Note Grey sentence that says how many
// Offers the file holds, Expired Offers too, and the language of its
// headings, and the outlined button, as wide as the column on a phone.
// While the file is on its way the button says so, its mark turns, and it
// cannot be pressed again. A refusal, or an API that cannot be reached, is
// the refusal panel above the button.
function DownloadSection({ vendorId }: { vendorId: string }) {
  const { t, i18n } = useTranslation();
  const download = useDownloadOfferSheet(vendorId);
  const busy = download.isPending;

  return (
    <section aria-labelledby="offer-sheet-download" className="flex flex-col gap-3">
      <h2 id="offer-sheet-download" className="text-base font-semibold">
        {t('OfferSheetScreen.downloadTitle')}
      </h2>
      <OffersInTheFile vendorId={vendorId} />
      <OpeningSpace>
        {download.error && (
          <Alert variant="destructive" data-testid="download-refusal">
            <AlertTitle>{t('OfferSheetScreen.notDownloaded')}</AlertTitle>
            <AlertDescription>
              <WhyNotAnsweredInThePortal error={download.error} />
            </AlertDescription>
          </Alert>
        )}
      </OpeningSpace>
      <Button
        type="button"
        variant="outline"
        data-testid="download-offer-sheet"
        className="w-full sm:w-auto sm:self-start"
        disabled={busy}
        onClick={() => download.mutate(i18n.language as Language)}
      >
        <BusyMark busy={busy} Icon={DownloadIcon} />
        <BusyLabel
          busy={busy}
          label={t('OfferSheetScreen.download')}
          busyLabel={t('OfferSheetScreen.downloading')}
        />
      </Button>
      <p aria-live="polite" className="sr-only">
        {busy && t('OfferSheetScreen.downloading')}
      </p>
    </section>
  );
}

// How many of the Vendor's Offers the file holds, all of them, Expired
// Offers among them, as the Offers screen counts them, and the language of
// its headings, the portal's. With none, that the file holds its headings
// alone, ready to fill.
function OffersInTheFile({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation();
  const listed = useVendorsOffers(vendorId, { words: '', state: 'all', page: 0 });
  const count = listed.data?.counts.offers;

  return (
    <p
      data-testid="offers-in-the-file"
      data-count={count}
      className="text-sm text-muted-foreground"
    >
      {count === undefined ? (
        t('OfferSheetScreen.readingOffers')
      ) : count === 0 ? (
        t('OfferSheetScreen.inTheFileNone')
      ) : (
        <Trans
          i18nKey="OfferSheetScreen.inTheFile"
          count={count}
          components={{
            count: <span className="tabular-nums">{formatNumber(count)}</span>,
          }}
        />
      )}
    </p>
  );
}

// "What the file holds", on Raised Stone with 8-pixel corners and a file
// mark: the six columns in their order; that a row finds its Part by its
// part number alone; what an empty price or warranty means; and that
// uploading confirms every Offer a row applies to (OFF-5).
function WhatTheFileHolds() {
  const { t } = useTranslation();

  return (
    <aside
      data-testid="what-the-file-holds"
      aria-labelledby="what-the-file-holds"
      className="flex min-w-0 flex-col gap-3 rounded-card bg-secondary p-4 text-sm lg:col-start-2 lg:row-start-1"
    >
      <h2
        id="what-the-file-holds"
        className="flex items-center gap-2 text-base font-semibold"
      >
        <FileSpreadsheetIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('OfferSheetScreen.holdsTitle')}
      </h2>
      <p>{t('OfferSheetScreen.holdsColumns')}</p>
      <p>{t('OfferSheetScreen.holdsMatch')}</p>
      <p>{t('OfferSheetScreen.holdsEmpty')}</p>
      <p>{t('OfferSheetScreen.holdsConfirms')}</p>
    </aside>
  );
}
