import type { PartRequestWithVendorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { TriangleAlertIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { OfferPlate } from '@/entities/offer';
import { Detail, DetailList, WrittenOnLines } from '@/entities/vendor';
import { dayWritten } from '@/shared/lib';
import { SectionTitle } from '@/shared/ui';

import { sentWritten } from '../model/days';
import { VendorOfTheRequest } from './vendor-of-the-request';

type Request = PartRequestWithVendorResponse;

// Everything the Vendor sent, as rows of details, as a Vendor's are (the
// dashboard's DESIGN.md, One Part Request): the Vendor, with its own link;
// when it was sent, as the API counts the days, with the day in Iraq's
// time; the Category as the Vendor gave it; the part number, broken
// anywhere; and the Offer it would make, its prices on the Rate Board's
// plate, muted when the Part is out of stock, dated by the sending beside
// it, then its stock and its warranty.
export function RequestDetails({ partRequest }: { partRequest: Request }) {
  return (
    <div data-testid="request-details">
      <DetailList>
        <Detail name="vendor" label="Vendor">
          {/* The link reaches into the row's padding, so that its words stand
              level with the detail's name and the row keeps its height. */}
          <VendorOfTheRequest vendor={partRequest.vendor} className="-my-3" />
        </Detail>
        <Detail name="sent" label="Sent">
          <span className="tabular-nums">{sentWritten(partRequest)}</span>
        </Detail>
        <Detail name="category" label="Category">
          {categoryName(partRequest.category)}
          <span className="text-muted-foreground">, as the Vendor gave it</span>
        </Detail>
        <Detail name="part-number" label="Part number">
          <AlwaysEnglish className="font-mono wrap-anywhere">
            {partRequest.partNumber}
          </AlwaysEnglish>
        </Detail>
        {/* The plate takes the whole row under its name, as a list of rows
            does on a Part's page, so that the widest prices the API takes
            fit the pane beside the queue (the inspector, at 1024). */}
        <div
          data-detail="offer"
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 py-3.5"
        >
          <dt className="col-span-full text-muted-foreground">Its Offer</dt>
          <dd className="col-span-full flex min-w-0 flex-col items-start gap-1.5">
            <OfferPlate offer={partRequest} narrow />
            <span className="flex flex-wrap gap-x-3">
              {partRequest.inStock ? (
                <span className="text-success">In stock</span>
              ) : (
                <span className="text-muted-foreground">Out of stock</span>
              )}
              <span className="text-muted-foreground">
                {partRequest.warrantyMonths === null
                  ? 'No warranty stated'
                  : `${formatNumber(partRequest.warrantyMonths)} ${
                      partRequest.warrantyMonths === 1 ? 'month' : 'months'
                    } warranty`}
              </span>
            </span>
          </dd>
        </div>
      </DetailList>
    </div>
  );
}

// The warning, before the Admin resolves it, that the Offer a fulfilment
// makes would be listed as expired, since it counts as confirmed when the
// request was sent, more than 14 days ago, by the API's answer alone: no
// frontend holds the 14 days. A Sheet panel with an Action Red edge, as the
// expiry banner is, since it asks the Admin to remind the Vendor; the
// dashboard has no warning colour.
export function WouldBeExpired({ partRequest }: { partRequest: Request }) {
  return (
    <section
      data-testid="offer-would-be-expired"
      aria-labelledby="offer-would-be-expired"
      className="flex flex-col gap-1.5 rounded-card border border-destructive bg-card p-4 text-sm"
    >
      <SectionTitle
        id="offer-would-be-expired"
        className="flex items-center gap-2 text-base font-semibold text-destructive"
      >
        <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
        Its Offer will be listed as expired
      </SectionTitle>
      <p>
        It was sent {formatNumber(partRequest.daysSinceSent)} days ago, and the Offer it
        makes counts as confirmed on that day. Shoppers will not see it until{' '}
        <AsWritten>{partRequest.vendor.name}</AsWritten> confirms its Offers: remind the
        Vendor once it is resolved.
      </p>
    </section>
  );
}

// How a resolved request was resolved, in the three ways' place, offering
// nothing: fulfilled, on its day, with the Part, which leads to its page; or
// rejected, on its day, with the reason as the Admin wrote it, in its own
// direction. The day is the Admin's own, as a Part's page writes the day it
// last changed; the API counts no days since a resolution, and no frontend
// counts them.
export function HowItWasResolved({ partRequest }: { partRequest: Request }) {
  const day =
    partRequest.resolvedAt === undefined ? '' : dayWritten(partRequest.resolvedAt);

  return (
    <div
      data-testid="how-it-was-resolved"
      className="flex flex-col gap-2 border-y border-rule py-3.5 text-sm"
    >
      {partRequest.state === 'fulfilled' && partRequest.part !== undefined ? (
        <p>
          Fulfilled on {day}, with{' '}
          <Link
            to={`/catalog/parts/${partRequest.part.id}`}
            className="hover-colour font-[550] underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <AlwaysEnglish>{partRequest.part.name}</AlwaysEnglish>
          </Link>
          .
        </p>
      ) : (
        <>
          <p>Rejected on {day}, with this reason:</p>
          <div data-testid="reason">
            <WrittenOnLines text={partRequest.reason ?? ''} />
          </div>
        </>
      )}
    </div>
  );
}
