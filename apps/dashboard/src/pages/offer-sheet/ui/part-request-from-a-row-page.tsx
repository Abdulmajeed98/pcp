import type { SendPartRequestRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import { useVendorShown } from '@/entities/vendor';
import {
  PartRequestForm,
  partRequestFormValuesFromARow,
  WhatHappensNext,
} from '@/features/part-request-form';
import { apiClient, dataOf, partRequestsKey } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { BackLink } from '@/shared/ui';

import { rowAskedFor, useKeptResult } from '../model/kept-result';
import type { AskedForARow } from './offer-sheet-page';

// The Part Request form started from a row of an Offer sheet that matched
// no Part (SHT-6), `offer-sheet/rows/<row>/part-request`: a screen of its
// own, under the Offer sheet screen's route, so that the upload's result,
// kept for the visit, survives it (the owner's d5, taken under the standing
// instruction of 18 November 2026, sheet ticket 03). Its back link says
// "Back to the result"; under its title and sentence, the form's line names
// the row and the file; then the form, filled from the row, the Category the
// one field left to choose, with "What happens next" beside it from 64rem,
// as the form from the section has it.
//
// It sends through `sendPartRequest`, so a Vendor still never creates a
// Part, and says the same refusals as the form always does. After a send
// every query under `['part-requests']` is asked again, and the screen
// returns to the result, which it marks as asked for and scrolls to. A row
// that is no longer kept, as after a reload, which loses the result, or one
// already asked for, leads back to the Offer sheet screen.
export function PartRequestFromARowPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const kept = useKeptResult(vendorId);
  const number = Number(useParams().row);
  const row = kept?.result.skipped.find(
    (each) => each.problem === 'noPart' && each.row === number,
  );
  // Whether the row was already asked for when the screen opened: the send
  // marks it so before it leads back, which must not lead back twice.
  const [askedBefore] = useState(() => kept?.asked.has(number) === true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const send = useMutation({
    mutationFn: (body: SendPartRequestRequest) =>
      dataOf(apiClient.sendPartRequest({ path: { vendorId }, body })),
    onSuccess: async () => {
      rowAskedFor(vendorId, number);
      await queryClient.invalidateQueries({
        queryKey: partRequestsKey,
        refetchType: 'all',
      });
      await navigate('..', {
        state: { asked: number } satisfies AskedForARow,
        preventScrollReset: true,
      });
    },
  });

  if (
    kept === undefined ||
    row === undefined ||
    row.partRequestOpen === true ||
    askedBefore
  ) {
    return <Navigate to=".." replace />;
  }

  return (
    <div data-testid="part-request-from-a-row" className="flex min-w-0 flex-col gap-4">
      <BackLink to="..">{t('OfferSheetScreen.backToTheResult')}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="screen-title">{t('NewPartRequest.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('NewPartRequest.intro')}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(16rem,1fr)]">
        <PartRequestForm
          values={partRequestFormValuesFromARow(row)}
          fromARow={{ row: row.row, fileName: kept.fileName }}
          save={(body) => send.mutateAsync(body)}
        />
        <WhatHappensNext />
      </div>
    </div>
  );
}
