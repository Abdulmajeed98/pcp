import type { CategoryResponse, PartRequestWithVendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { useQueryClient } from '@tanstack/react-query';
import {
  type ReactNode,
  type RefObject,
  type TransitionEvent,
  useRef,
  useState,
} from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { OfferPlate } from '@/entities/offer';
import { type PartCreatedFromARequest, partsKey } from '@/entities/part';
import { type PartFields, PartForm } from '@/features/part-form';
import { apiClient, dataOf, Refusal, WhyNotAnswered } from '@/shared/api';
import { aScroll, useAddressKeepingTheQuery } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  BackLink,
  BusyLabel,
  Button,
  OpeningSpace,
  ScreenTitle,
  SectionTitle,
} from '@/shared/ui';

import { usePartRequest } from '../api/part-requests';
import { askAgainAboutThePartRequests, isResolvedAlready, useFulfil } from '../api/resolve';

type Request = PartRequestWithVendorResponse;

// The form for a new Part, opened from a Part Request: the `part-form`
// feature, filled with the request's name, part number and Category, which
// the Admin completes with the manufacturer and the specifications as for
// any Part (the owner's d9, part-requests ticket 02). Saving creates the
// Part through the catalog's own create, then fulfils the request with it,
// in that order, which is safe if the second fails, and leads to the new
// Part's page, to add its photo, with a note saying what became of the
// Vendor's Offer (CAT-6).
//
// If the fulfilment is refused or not answered, the Part is in the catalog
// and the request still open: the screen says so above the form, which is
// dimmed and loses its button, and offers to fulfil the request with that
// Part, so that the Part is never created twice. A request already resolved
// is shown on its own screen instead, which says how.
export function NewPartFromARequestPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { partRequestId = '' } = useParams();
  const read = usePartRequest(partRequestId);
  const categories = useCategories();
  const requestsAddress = keepingTheQuery(`/part-requests/${partRequestId}`);
  const back = <BackLink to={requestsAddress}>The request</BackLink>;

  const error = read.error ?? categories.error;
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <ScreenTitle className="screen-title">
          {read.error
            ? 'The Part Request could not be read'
            : 'The Categories could not be read'}
        </ScreenTitle>
        <Alert variant="destructive" data-testid="refusal">
          <AlertDescription>
            <WhyNotAnswered error={error} />
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (read.data === undefined || categories.data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <p className="text-sm text-muted-foreground">Reading the Part Request…</p>
      </div>
    );
  }
  if (read.data.state !== 'open') return <Navigate to={requestsAddress} replace />;

  return <NewPart partRequest={read.data} categories={categories.data} back={back} />;
}

// The Part created, while the request is still open.
interface Created {
  id: string;
  name: string;
}

function NewPart({
  partRequest,
  categories,
  back,
}: {
  partRequest: Request;
  categories: readonly CategoryResponse[];
  back: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(
    () => categories.find(({ key }) => key === partRequest.category) ?? categories[0],
  );
  const [created, setCreated] = useState<Created | null>(null);
  const [notFulfilled, setNotFulfilled] = useState<Error | null>(null);
  const halfway = useRef<HTMLDivElement>(null);
  const fulfilAgain = useRef<HTMLButtonElement>(null);
  const fulfil = useFulfil(partRequest, async (fulfilled, part) => {
    const state: PartCreatedFromARequest = {
      createdFrom: {
        requestName: partRequest.name,
        vendorName: partRequest.vendor.name,
        partName: part.name,
        offer: fulfilled.offer,
      },
    };
    await navigate(`/catalog/parts/${part.id}`, { state });
  });

  // Fulfils the request with the Part created. A refusal that says it was
  // resolved meanwhile shows the request's own screen, which says how;
  // anything else keeps the halfway case on the screen, with why.
  async function fulfilWith(part: Created): Promise<void> {
    try {
      await fulfil.mutateAsync(part);
    } catch (error) {
      if (isResolvedAlready(error)) {
        await askAgainAboutThePartRequests(queryClient);
        return;
      }
      setNotFulfilled(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Creates the Part, through the catalog's own create, then fulfils the
  // request with it. A refusal of the Part is thrown back to the form, which
  // says it beside its field.
  async function save(fields: PartFields): Promise<void> {
    const part = await dataOf(
      apiClient.createPart({ body: { ...fields, category: category.key } }),
    );
    const made = { id: part.id, name: part.name };
    setCreated(made);
    void queryClient.invalidateQueries({ queryKey: partsKey });
    await fulfilWith(made);
  }

  // Once the halfway case's space has opened, it is scrolled into sight, and
  // its action takes the focus, since the form's button that had it is gone.
  function keepTheHalfwayInSight(event: TransitionEvent<HTMLDivElement>): void {
    const panel = halfway.current;
    if (event.propertyName !== 'grid-template-rows' || panel === null) return;
    if (!(event.target instanceof Node) || !event.target.contains(panel)) return;
    panel.scrollIntoView({ block: 'nearest', behavior: aScroll() });
    fulfilAgain.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6" onTransitionEnd={keepTheHalfwayInSight}>
      <div className="flex flex-col gap-4">
        {back}
        <div className="flex flex-col gap-1">
          <ScreenTitle className="screen-title">New Part</ScreenTitle>
          <p className="text-sm text-muted-foreground">
            Filled from the request. Give its manufacturer and its specifications as for any
            Part.
          </p>
        </div>
      </div>
      <FromTheRequest partRequest={partRequest} />
      {/* Its space opens as a refusal panel's does, above the dimmed form. */}
      <OpeningSpace>
        {created !== null && notFulfilled !== null && (
          <Halfway
            ref={halfway}
            actionRef={fulfilAgain}
            created={created}
            why={notFulfilled}
            busy={fulfil.isPending}
            onFulfil={() => void fulfilWith(created)}
          />
        )}
      </OpeningSpace>
      <PartForm
        category={category}
        start={{ name: partRequest.name, partNumbers: [partRequest.partNumber] }}
        chooseCategory={{
          categories,
          description: (
            <>
              The Vendor gave {categoryName(partRequest.category)}. Change it if the Part is
              of another Category; its specifications follow.
            </>
          ),
          onChoose: setCategory,
        }}
        closed={created !== null}
        submitLabel="Create the Part"
        busyLabel="Creating the Part…"
        save={save}
      />
    </div>
  );
}

// What the Vendor sent, at the head of the form, on Raised Stone, so that the
// Admin compares while filling it in: its name as written, its Category and
// part number, and the Offer it makes once the Part is created.
function FromTheRequest({ partRequest }: { partRequest: Request }) {
  return (
    <aside
      data-testid="from-the-request"
      aria-labelledby="from-the-request"
      className="flex min-w-0 flex-col items-start gap-2 rounded-card bg-secondary p-4 text-sm"
    >
      <SectionTitle id="from-the-request" className="text-base font-semibold">
        From <AsWritten>{partRequest.vendor.name}</AsWritten>’s request
      </SectionTitle>
      <p className="font-[550]">
        <AsWritten className="wrap-anywhere">{partRequest.name}</AsWritten>
      </p>
      <p className="text-muted-foreground">
        {categoryName(partRequest.category)}
        {' · '}
        <AlwaysEnglish className="font-mono wrap-anywhere">
          {partRequest.partNumber}
        </AlwaysEnglish>
      </p>
      <OfferPlate offer={partRequest} />
      <p className="text-muted-foreground">
        Its Offer is made with these details once the Part is created.
      </p>
    </aside>
  );
}

// Why a fulfilment was not answered, as the end of a sentence.
function whyNot(error: Error): string {
  return error instanceof Refusal
    ? `the API refused, with ${error.status}, ${error.code}`
    : 'the API could not be reached';
}

// The halfway case: the refusal panel, its title saying what was done and
// what was not, its sentence why, then the one action that finishes the
// work, never a second create, and the way to the Part.
function Halfway({
  ref,
  actionRef,
  created,
  why,
  busy,
  onFulfil,
}: {
  ref: RefObject<HTMLDivElement | null>;
  actionRef: RefObject<HTMLButtonElement | null>;
  created: Created;
  why: Error;
  busy: boolean;
  onFulfil: () => void;
}) {
  return (
    <div
      ref={ref}
      role="alert"
      data-testid="halfway"
      className="flex scroll-my-4 flex-col gap-2 rounded-card border border-destructive bg-card p-4 text-sm"
    >
      <SectionTitle className="text-base font-semibold text-destructive">
        The Part was created, but the request is still open
      </SectionTitle>
      <p>
        <AlwaysEnglish>{created.name}</AlwaysEnglish> is in the catalog now. Fulfilling the
        request with it was not answered: {whyNot(why)}. Fulfil it with this Part, rather
        than creating the Part again.
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button ref={actionRef} disabled={busy} onClick={onFulfil}>
          <BusyLabel busy={busy} label="Fulfil it with this Part" busyLabel="Fulfilling…" />
        </Button>
        <Link
          to={`/catalog/parts/${created.id}`}
          className="hover-colour flex min-h-control items-center underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open the Part
        </Link>
      </div>
    </div>
  );
}
