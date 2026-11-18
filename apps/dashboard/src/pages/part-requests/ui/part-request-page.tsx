import type { PartRequestWithVendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { PlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  BackLink,
  Button,
  buttonVariants,
  ScreenTitle,
  SectionTitle,
} from '@/shared/ui';

import { usePartRequest } from '../api/part-requests';
import { MatchIt } from './match-it';
import { RejectIt } from './reject-it';
import { HowItWasResolved, RequestDetails, WouldBeExpired } from './request-details';

type Request = PartRequestWithVendorResponse;

// One Part Request, as the dashboard's DESIGN.md lays it out (the owner's
// d7, part-requests ticket 02): its title, the request's name as the Vendor
// wrote it, whole, and whose request it is; the warning when its Offer would
// be listed as expired; everything the Vendor sent; and its three ways, in
// the order the Admin works: Match it to a Part, already searched with its
// part number, Create the Part, and Reject it. A resolved request, opened
// from an old link or after a refusal that says it was resolved meanwhile,
// shows how it was resolved in their place, and offers nothing.
//
// Beside the queue on a desk, and the whole screen on a phone, with a way
// back to the queue on the page it was opened from.
export function PartRequestPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { partRequestId = '' } = useParams();
  const read = usePartRequest(partRequestId);
  const back = <BackLink to={keepingTheQuery('/part-requests')}>Part Requests</BackLink>;

  if (read.error) {
    const missing = read.error instanceof Refusal && read.error.status === 404;
    // A request the API does not give is a screen of its own: its title says
    // what was not done, the refusal panel why, and the Admin may try again
    // (redesign ticket 08's break-ui).
    return (
      <div className="flex flex-col gap-4">
        {back}
        <ScreenTitle className="screen-title">
          {missing ? 'Part Request not found' : 'The Part Request could not be read'}
        </ScreenTitle>
        {missing ? (
          <p>No Part Request has this address.</p>
        ) : (
          <>
            <Alert variant="destructive" data-testid="refusal">
              <AlertDescription>
                <WhyNotAnswered error={read.error} />
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="self-start"
              onClick={() => void read.refetch()}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    );
  }
  if (read.data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <p className="text-sm text-muted-foreground">Reading the Part Request…</p>
      </div>
    );
  }

  return <TheRequest partRequest={read.data} back={back} />;
}

// How each state is said in the sentence under the title, by CONTEXT.md's
// terms.
const whose: Record<Request['state'], string> = {
  open: 'An open Part Request of',
  fulfilled: 'A fulfilled Part Request of',
  rejected: 'A rejected Part Request of',
};

function TheRequest({ partRequest, back }: { partRequest: Request; back: ReactNode }) {
  const open = partRequest.state === 'open';

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4">
        {back}
        <div className="flex flex-col gap-1">
          {/* The whole name, wrapping in full, however long: it is all the
              Admin has to find the Part (part-requests ticket 02's
              break-ui). */}
          <ScreenTitle className="screen-title wrap-anywhere">
            <AsWritten>{partRequest.name}</AsWritten>
          </ScreenTitle>
          <p className="text-sm text-muted-foreground">
            {whose[partRequest.state]} <AsWritten>{partRequest.vendor.name}</AsWritten>.
          </p>
        </div>
      </div>
      {open && partRequest.offerWouldBeExpired && (
        <WouldBeExpired partRequest={partRequest} />
      )}
      <RequestDetails partRequest={partRequest} />
      {open ? (
        <>
          <MatchIt partRequest={partRequest} />
          <CreateIt partRequest={partRequest} />
          <RejectIt partRequest={partRequest} />
        </>
      ) : (
        <HowItWasResolved partRequest={partRequest} />
      )}
    </div>
  );
}

// The second way, for a Part the catalog lacks: the form for a new Part,
// filled from the request, on its own address under the request.
function CreateIt({ partRequest }: { partRequest: Request }) {
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <section aria-labelledby="create-it" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionTitle id="create-it" className="text-base font-semibold">
          Create the Part
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          Not in the catalog? Create it from this request, with its manufacturer and its
          specifications. The Vendor’s Offer is made with it.
        </p>
      </div>
      <Link
        to={keepingTheQuery(`/part-requests/${partRequest.id}/new-part`)}
        className={buttonVariants({ variant: 'outline', className: 'self-start' })}
      >
        <PlusIcon data-icon="inline-start" aria-hidden="true" />
        Create the Part
      </Link>
    </section>
  );
}
