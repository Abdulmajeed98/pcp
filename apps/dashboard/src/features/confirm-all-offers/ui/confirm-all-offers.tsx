import { formatNumber } from '@pcp/i18n';
import { CheckCheckIcon } from 'lucide-react';

import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui';

import type { useConfirmAllOffers } from '../api/confirm-all';

// What a screen holds while it offers to confirm all of a Vendor's Offers:
// the action, as `useConfirmAllOffers` gives it.
type Confirming = ReturnType<typeof useConfirmAllOffers>;

// The button that confirms all the Vendor's Offers at once, the pane's one
// primary button. While the API is asked, it says so and waits. A refusal
// is said below it, in the portal's language: what was not done, and why.
export function ConfirmAllButton({ confirming }: { confirming: Confirming }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        disabled={confirming.isPending}
        onClick={() => confirming.mutate()}
        className="w-full sm:w-auto"
      >
        <CheckCheckIcon data-icon="inline-start" />
        {confirming.isPending
          ? t('ConfirmAllOffers.confirming')
          : t('ConfirmAllOffers.confirmAll')}
      </Button>
      {confirming.error && (
        <p role="alert" className="text-sm text-destructive">
          {t('ConfirmAllOffers.notConfirmed')}{' '}
          <WhyNotAnsweredInThePortal error={confirming.error} />
        </p>
      )}
    </div>
  );
}

// What confirm-all did, once the API has answered: how many Offers it
// confirmed, a sentence that counts. It is announced when it appears, and it
// stays after the banner has left, until the screen is left.
export function ConfirmedAll({ confirming }: { confirming: Confirming }) {
  const confirmed = confirming.data?.confirmed;

  return (
    <output
      data-testid={confirmed === undefined ? undefined : 'confirmed'}
      className={
        confirmed === undefined
          ? 'sr-only'
          : 'flex items-center gap-2 text-sm font-medium text-success'
      }
    >
      {confirmed !== undefined && (
        <>
          <CheckCheckIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>
            <Trans
              i18nKey="ConfirmAllOffers.confirmed"
              count={confirmed}
              components={{
                count: <span data-testid="confirmed-count">{formatNumber(confirmed)}</span>,
              }}
            />
          </span>
        </>
      )}
    </output>
  );
}
