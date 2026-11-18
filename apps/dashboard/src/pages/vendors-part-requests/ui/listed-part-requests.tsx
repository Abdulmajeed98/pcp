import type { PartRequestResponse, VendorsPartRequestsPageResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { useState } from 'react';

import { Trans, useTranslation } from '@/shared/i18n';
import { useLeavingRows, useWideScreen } from '@/shared/lib';
import { ListPages, PastTheLastPage } from '@/shared/ui';

import { PartRequestsList, PartRequestsTable } from './part-request-rows';

// The Vendor's Part Requests on this page: how many there are, in words on
// the end side of the filter bar's line, never on a plate, then the rows,
// newest first, then the way to the other pages, 20 a page. While the next
// page is on its way, the last answer stays, at full strength, and a line
// beside the count says that the next is on its way.
//
// The request just sent, `arriving`, arrives first in the list as a new row
// does (Motion 12), when the list is first drawn on the Vendor's return from
// the form; a row new to the same page answered again arrives so too, and a
// row it no longer holds leaves.
export function ListedPartRequests({
  listed,
  reading,
  arriving,
  onPage,
}: {
  listed: VendorsPartRequestsPageResponse;
  reading: boolean;
  arriving: string | undefined;
  onPage: (page: number) => void;
}) {
  const { t } = useTranslation();
  const wide = useWideScreen();
  const { content, totalElements, pageNumber, totalPages, first, last } = listed;
  const shown = useLeavingRows<PartRequestResponse>(content, ({ id }) => id, pageNumber);
  // The request just sent arrives only with the list's first drawing, and
  // not again once the Vendor has gone to another page.
  const [arrivingFirst, setArrivingFirst] = useState(
    arriving === undefined ? undefined : { key: arriving, page: pageNumber },
  );
  if (arrivingFirst !== undefined && arrivingFirst.page !== pageNumber) {
    setArrivingFirst(undefined);
  }
  const rows = shown.map((row) =>
    row.key === arrivingFirst?.key ? { ...row, arriving: true } : row,
  );
  const Rows = wide ? PartRequestsTable : PartRequestsList;

  return (
    <section
      aria-labelledby="part-requests-counted"
      aria-busy={reading}
      className="flex flex-col gap-4"
    >
      <p className="flex min-h-control flex-wrap items-center justify-end gap-x-3 text-sm text-muted-foreground">
        <span aria-live="polite">{reading && t('PartRequestsScreen.reading')}</span>
        <span id="part-requests-counted" data-testid="part-requests-counted">
          <Trans
            i18nKey="PartRequestsScreen.counted"
            count={totalElements}
            components={{
              count: (
                <span data-testid="part-requests-count" className="tabular-nums">
                  {formatNumber(totalElements)}
                </span>
              ),
            }}
          />
        </span>
      </p>

      {content.length > 0 ? (
        <Rows shown={rows} />
      ) : (
        <PastTheLastPage
          onFirstPage={() => onPage(0)}
          words={{
            title: t('PartRequestsScreen.pastTheLast'),
            firstPage: t('PartRequestsScreen.firstPage'),
          }}
        />
      )}

      {totalPages > 1 && (
        <ListPages
          label={t('PartRequestsScreen.pages')}
          pageNumber={pageNumber}
          totalPages={totalPages}
          first={first}
          last={last}
          onPage={onPage}
          words={{
            previous: t('PartRequestsScreen.previous'),
            next: t('PartRequestsScreen.next'),
            where: (
              <Trans
                i18nKey="PartRequestsScreen.page"
                components={{
                  page: <>{formatNumber(pageNumber + 1)}</>,
                  pages: <>{formatNumber(totalPages)}</>,
                }}
              />
            ),
          }}
        />
      )}
    </section>
  );
}
