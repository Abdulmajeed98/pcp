import { AsWritten } from '@pcp/ui';
import { CircleCheckIcon, PackagePlusIcon, PlusIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { useVendorShown } from '@/entities/vendor';
import type { SentPartRequest } from '@/features/part-request-form';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { usePageInTheAddress, useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Announced,
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Leaving,
  ScreenAction,
} from '@/shared/ui';

import { useVendorsPartRequests } from '../api/vendors-part-requests';
import { ListedPartRequests } from './listed-part-requests';

// The Vendor's Part Requests, the portal's second section, `part-requests`
// (REQ-4): every Part Request the Vendor has sent, in every state, newest
// first, in the portal's language, laid out for a phone 360 pixels wide
// first, as the dashboard's DESIGN.md lays it out (the owner's d5, taken
// under the standing instruction of 18 November 2026, part-requests ticket
// 02).
//
// Its title row first, "Your Part Requests" with its Note Grey sentence,
// and the outlined Send a Part Request on the end side from 64rem, which on
// a phone is the bar's one action, a plus, named, as Add an Offer is on the
// Offers screen. Then the note after a send, which arrives as Motion 6 says
// and leaves as Motion 8 says once the Vendor goes to another page; then the
// count in words and the list, 20 a page, its page in the address. A Vendor
// with none is told so in their place, with the way to the form. A refusal
// and an API that cannot be reached are said in words, as the portal says
// them everywhere.
//
// Every link is relative to the route, so that the Admin acting as the
// Vendor sees and sends the same, under the band.
export function VendorsPartRequestsPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const [page, show] = usePageInTheAddress();
  const listed = useVendorsPartRequests(vendorId, page);
  const wide = useWideScreen();
  const sent = (useLocation().state as SentPartRequest | null)?.sent ?? null;

  return (
    // The blocks below the title row hold the gap above them, so that the
    // note, which leaves, takes its gap with it (Motion 8).
    <div data-testid="vendors-part-requests" className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="screen-title">{t('PartRequestsScreen.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('PartRequestsScreen.intro')}</p>
        </div>
        {wide ? (
          <Link
            to="new"
            data-testid="send-part-request"
            className={buttonVariants({ variant: 'outline' })}
          >
            <PlusIcon data-icon="inline-start" />
            {t('PartRequestsScreen.send')}
          </Link>
        ) : (
          <ScreenAction>
            <Link
              to="new"
              data-testid="send-part-request"
              aria-label={t('PartRequestsScreen.send')}
              title={t('PartRequestsScreen.send')}
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: '-me-2',
              })}
            >
              <PlusIcon aria-hidden="true" />
            </Link>
          </ScreenAction>
        )}
      </div>
      {/* The live region is always there, and the note arrives in it once
          it is in the page, so that the note is announced. */}
      <output className="block">
        <Leaving value={sent?.name ?? null}>
          {(name) => (
            <div className={gapAbove}>
              <Announced>
                <SentNote name={name} />
              </Announced>
            </div>
          )}
        </Leaving>
      </output>

      <div className={gapAbove}>
        {listed.error ? (
          <Alert variant="destructive" data-testid="refusal">
            <AlertTitle>{t('PartRequestsScreen.notListed')}</AlertTitle>
            <AlertDescription>
              <WhyNotAnsweredInThePortal error={listed.error} />
            </AlertDescription>
          </Alert>
        ) : listed.data === undefined ? (
          <Reading wide={wide} />
        ) : listed.data.totalElements === 0 ? (
          <NoPartRequests />
        ) : (
          <ListedPartRequests
            listed={listed.data}
            reading={listed.isPlaceholderData}
            arriving={sent?.id}
            onPage={show}
          />
        )}
      </div>
    </div>
  );
}

// The gap above each block below the title row: 16 pixels on a phone, 24
// from 64rem.
const gapAbove = 'pt-4 lg:pt-6';

// The note that a Part Request was sent, naming it as the Vendor wrote it,
// drawn as the note after an Offer is added: a Sheet panel with a Confirmed
// Green edge and 8-pixel corners, its title in Confirmed Green after a
// circled tick, and its sentence.
function SentNote({ name }: { name: string }) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="part-request-sent"
      className="arrives flex flex-col gap-1 rounded-card border border-success bg-card px-4 py-3 text-sm"
    >
      <span className="flex items-center gap-2 text-base font-semibold text-success">
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('PartRequestsScreen.sentTitle')}
      </span>
      <span>
        <Trans
          i18nKey="PartRequestsScreen.sentNote"
          components={{ name: <AsWritten className="wrap-anywhere">{name}</AsWritten> }}
        />
      </span>
    </div>
  );
}

// What the screen says to a Vendor that has sent no Part Request, in place
// of the count and the list, with the way to the form: the section's
// package and plus, plain, at 32 pixels.
function NoPartRequests() {
  const { t } = useTranslation();

  return (
    <Empty data-testid="no-part-requests" className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackagePlusIcon />
        </EmptyMedia>
        <EmptyTitle>{t('PartRequestsScreen.none')}</EmptyTitle>
        <EmptyDescription>{t('PartRequestsScreen.noneDescription')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to="new" className={buttonVariants({ variant: 'outline' })}>
          <PlusIcon data-icon="inline-start" />
          {t('PartRequestsScreen.send')}
        </Link>
      </EmptyContent>
    </Empty>
  );
}

// Rows sketched in Raised Stone where the first answer will be, in the shape
// of the rows to come, still: they do not shimmer.
function Reading({ wide }: { wide: boolean }) {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        {t('PartRequestsScreen.reading')}
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3].map((row) => (
          <li
            key={row}
            className={
              wide
                ? 'flex h-16 items-start gap-6 pt-3.5'
                : 'flex flex-col justify-center gap-2 py-3'
            }
          >
            <span className="h-3.5 w-1/3 rounded-plate bg-secondary" />
            <span className="h-6 w-28 rounded-plate bg-secondary" />
            <span className="h-3.5 w-1/5 rounded-plate bg-secondary" />
          </li>
        ))}
      </ul>
    </div>
  );
}
