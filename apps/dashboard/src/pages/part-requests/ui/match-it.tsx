import type {
  FoundPartResponse,
  PartRequestFulfilmentResponse,
  PartRequestWithVendorResponse,
} from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { useQueryClient } from '@tanstack/react-query';
import { CircleCheckIcon, SearchIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';

import { categoryName } from '@/entities/category';
import { PartNumbers } from '@/entities/part';
import { WhyNotAnswered } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRefusal,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  BusyLabel,
  Button,
  Input,
  Label,
  ListPages,
  SectionTitle,
} from '@/shared/ui';

import { useMatchSearch, useWhatFulfillingWouldDo } from '../api/part-requests';
import {
  askAgainAboutThePartRequests,
  isResolvedAlready,
  useBackToTheQueue,
  useFulfil,
} from '../api/resolve';

type Request = PartRequestWithVendorResponse;

// The first of a request's three ways: a search of the whole catalog, by
// name, manufacturer or part number, in any Category, already searched with
// the request's part number when the request opens, so that whether the
// catalog holds the Part is on the screen before the Admin asks (the owner's
// d7 and d8, part-requests ticket 02). It names the request's Vendor, so
// that each Part found says whether that Vendor offers it already. The
// search is the screen's own field, left to right, searching on Enter or the
// keyboard's search key, with no button of its own. A new search, or another
// page, replaces the results at once (Motion 9).
export function MatchIt({ partRequest }: { partRequest: Request }) {
  const [typed, setTyped] = useState(partRequest.partNumber);
  const [searched, setSearched] = useState({ words: partRequest.partNumber, page: 0 });
  const found = useMatchSearch(partRequest.vendor.id, searched.words, searched.page);

  function search(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearched({ words: typed, page: 0 });
  }

  return (
    <section aria-labelledby="match-it" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionTitle id="match-it" className="text-base font-semibold">
          Match it to a Part
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          Searched for the request’s part number first. Any Category can match it.
        </p>
      </div>
      <search>
        <form onSubmit={search}>
          <Label htmlFor="match-search" className="sr-only">
            Search the catalog
          </Label>
          <div className="relative min-w-0">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="match-search"
              type="search"
              dir="ltr"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Name, manufacturer or part number"
              className="ps-9"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
        </form>
      </search>
      {found.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The catalog could not be searched.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={found.error} />
          </AlertDescription>
        </Alert>
      ) : found.data === undefined ? (
        <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
          Searching…
        </p>
      ) : found.data.totalElements === 0 ? (
        <NothingFound partRequest={partRequest} words={searched.words} />
      ) : (
        <div aria-busy={found.isPlaceholderData} className="flex flex-col gap-3">
          <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
            <span aria-live="polite">{found.isPlaceholderData && 'Searching…'}</span>
            <span>
              <span data-testid="matches-count" className="tabular-nums">
                {formatNumber(found.data.totalElements)}
              </span>{' '}
              {found.data.totalElements === 1 ? 'Part found' : 'Parts found'}
            </span>
          </p>
          <ul aria-label="Parts to match" className="-mx-2 border-t border-rule">
            {found.data.content.map((part) => (
              <li key={part.id} className="border-b border-rule">
                <PartToMatch partRequest={partRequest} part={part} />
              </li>
            ))}
          </ul>
          {found.data.totalPages > 1 && (
            <ListPages
              label="Pages of the Parts to match"
              pageNumber={found.data.pageNumber}
              totalPages={found.data.totalPages}
              first={found.data.first}
              last={found.data.last}
              onPage={(page) => setSearched({ ...searched, page })}
            />
          )}
        </div>
      )}
    </section>
  );
}

// A search that found nothing says so between two Rule lines, and what may
// find the Part still: a search by its name, in any Category, or creating it.
function NothingFound({ partRequest, words }: { partRequest: Request; words: string }) {
  return (
    <output
      data-testid="nothing-to-match"
      className="flex flex-col items-center gap-1 border-y border-rule px-4 py-5 text-center text-sm"
    >
      <p className="font-semibold">
        {words.trim() === partRequest.partNumber ? (
          <>
            No Part has the part number{' '}
            <AlwaysEnglish className="font-mono wrap-anywhere">
              {partRequest.partNumber}
            </AlwaysEnglish>
          </>
        ) : (
          <>
            No Part has “
            <AlwaysEnglish className="wrap-anywhere">{words.trim()}</AlwaysEnglish>” in its
            name, its manufacturer or a part number
          </>
        )}
      </p>
      <p className="text-muted-foreground">
        Search by its name too, in any Category. If the catalog lacks it, create the Part.
      </p>
    </output>
  );
}

// A Part the search found, as the Catalog's row draws one: its name, one
// Note Grey line with its manufacturer and Category, and its part numbers;
// a Part the request's Vendor offers adds a line in Confirmed Green, as the
// portal's search marks the Vendor's own. At its end, in one fixed place,
// an outlined Match, which asks once; the row itself is not a link, so that
// a thumb scrolling the results asks nothing (the owner's d8).
function PartToMatch({
  partRequest,
  part,
}: {
  partRequest: Request;
  part: FoundPartResponse;
}) {
  return (
    <div
      data-testid="part-to-match"
      className="flex items-start justify-between gap-3 px-2 py-3 text-sm"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <AlwaysEnglish
          data-testid="part-name"
          className="block w-fit max-w-full font-[550] wrap-anywhere"
        >
          {part.name}
        </AlwaysEnglish>
        <p className="text-muted-foreground">
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          {categoryName(part.category)}
        </p>
        <PartNumbers part={part} />
        {part.offerId !== null && (
          <p
            data-testid="offered"
            className="flex items-center gap-1 font-medium text-success"
          >
            <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>
              <AsWritten>{partRequest.vendor.name}</AsWritten> offers this Part
            </span>
          </p>
        )}
      </div>
      <MatchPart partRequest={partRequest} part={part} />
    </div>
  );
}

// Match, which asks once, in shadcn/ui's alert dialog, saying what fulfilling
// will do with the Vendor's Offer: made with the request's details,
// replaced by them, or kept, as the API answers when the dialog opens, with
// the warning that the Offer would be listed as expired only when that
// answer says so (the code review's Spec finding 1). While the answer is on
// its way, or if none comes, it says the rule by what the search said of
// the Vendor, and that the request is fulfilled either way (the dashboard's
// DESIGN.md, Matching a Part Request). Its action is the primary button, not
// red, since it destroys nothing, and never waits for the answer: the
// fulfilment judges again, and the note says what it did. A refusal is
// said in the dialog, which stays open to try again; one that says the
// request was resolved meanwhile closes it, and the screen shows how.
function MatchPart({
  partRequest,
  part,
}: {
  partRequest: Request;
  part: FoundPartResponse;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const backToTheQueue = useBackToTheQueue(partRequest);
  const fulfil = useFulfil(partRequest, (fulfilled, matched) =>
    backToTheQueue(fulfilled.offer, matched.name),
  );
  const foreseen = useWhatFulfillingWouldDo(partRequest.id, part.id, open);

  function openOrClose(next: boolean): void {
    // A fulfilment on its way finishes before the dialog closes.
    if (!next && fulfil.isPending) return;
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) fulfil.reset();
  }

  function match(): void {
    fulfil.mutate(part, {
      onError: (error) => {
        if (!isResolvedAlready(error)) return;
        setOpen(false);
        void askAgainAboutThePartRequests(queryClient);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={openOrClose}>
      <AlertDialogTrigger render={<Button variant="outline" className="shrink-0" />}>
        Match<span className="sr-only"> to {part.name}</span>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby={`${id}-part ${id}-description`}>
        <AlertDialogHeader>
          <AlertDialogTitle>Match this request to the Part?</AlertDialogTitle>
          {/* The Part on a line of its own under the question. */}
          <p id={`${id}-part`} className="font-[550]">
            <AlwaysEnglish className="block w-fit max-w-full wrap-anywhere">
              {part.name}
            </AlwaysEnglish>
          </p>
          <AlertDialogDescription id={`${id}-description`}>
            {foreseen.data === undefined ? (
              <TheRule partRequest={partRequest} part={part} />
            ) : (
              <TheOutcome partRequest={partRequest} foreseen={foreseen.data} />
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRefusal>
          {fulfil.error && !isResolvedAlready(fulfil.error) && (
            <>
              The request was not fulfilled. <WhyNotAnswered error={fulfil.error} />
            </>
          )}
        </AlertDialogRefusal>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={fulfil.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={fulfil.isPending} onClick={match}>
            <BusyLabel busy={fulfil.isPending} label="Match" busyLabel="Matching…" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// The question's words once the API has said what fulfilling will do: the
// one outcome for the Vendor's Offer, the warning only when the Offer would
// be expired, and the request fulfilled.
function TheOutcome({
  partRequest,
  foreseen,
}: {
  partRequest: Request;
  foreseen: PartRequestFulfilmentResponse;
}) {
  const vendor = <AsWritten>{partRequest.vendor.name}</AsWritten>;
  const offer: Record<PartRequestFulfilmentResponse['offer'], ReactNode> = {
    created: (
      <>
        {vendor} has no Offer for this Part. Its Offer is made with the request’s price,
        stock and warranty.
      </>
    ),
    replaced: (
      <>
        {vendor} already offers this Part, last confirmed before this request was sent, so
        the request’s price, stock and warranty replace its Offer’s.
      </>
    ),
    kept: (
      <>
        {vendor} already offers this Part, and confirmed it after this request was sent, so
        its Offer is kept as it is.
      </>
    ),
  };

  return (
    <>
      {offer[foreseen.offer]}{' '}
      {foreseen.offerWouldBeExpired && <Expired partRequest={partRequest} />}
      {foreseen.offer === 'kept'
        ? 'The request is still fulfilled, and leaves the queue.'
        : 'The request is fulfilled, and leaves the queue.'}
    </>
  );
}

// The question's words while the API's answer is on its way, or when none
// came: the rule, by what the search said of the Vendor, since only the API
// knows when the Vendor last confirmed its Offer.
function TheRule({ partRequest, part }: { partRequest: Request; part: FoundPartResponse }) {
  const vendor = <AsWritten>{partRequest.vendor.name}</AsWritten>;

  return (
    <>
      {part.offerId === null ? (
        <>
          {vendor} has no Offer for this Part. Its Offer is made with the request’s price,
          stock and warranty.
        </>
      ) : (
        <>
          {vendor} already offers this Part. If its Offer was last confirmed before this
          request was sent, the request’s price, stock and warranty replace it; if not, its
          Offer is kept as it is.
        </>
      )}{' '}
      {partRequest.offerWouldBeExpired && <Expired partRequest={partRequest} />}
      The request is fulfilled either way, and leaves the queue.
    </>
  );
}

// That the Offer, confirmed when the request was sent, would be listed as
// expired, by the days the API counted since.
function Expired({ partRequest }: { partRequest: Request }) {
  return (
    <>
      It counts as confirmed {formatNumber(partRequest.daysSinceSent)} days ago, so it is
      listed as expired until the Vendor confirms it.{' '}
    </>
  );
}
