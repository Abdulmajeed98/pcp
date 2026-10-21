import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { CheckCheckIcon } from 'lucide-react';

import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui';

import type { useConfirmAllOffers } from '../api/confirm-all';

// What a screen holds while it offers to confirm all of a Vendor's Offers:
// the action, as `useConfirmAllOffers` gives it.
type Confirming = ReturnType<typeof useConfirmAllOffers>;

// The button that confirms all the Vendor's Offers at once, the pane's one
// primary button, as wide as its panel on a phone. While the API is asked,
// it says so and waits, keeping its width. A refusal is said below it, in
// the portal's language: what was not done, and why.
export function ConfirmAllButton({ confirming }: { confirming: Confirming }) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
      <Button
        disabled={confirming.isPending}
        onClick={() => confirming.mutate()}
        className="w-full lg:w-auto"
      >
        <CheckCheckIcon data-icon="inline-start" />
        {confirming.isPending
          ? t('ConfirmAllOffers.confirming')
          : t('ConfirmAllOffers.confirmAll')}
      </Button>
      {confirming.error && (
        <p role="alert" className="arrives text-sm text-destructive">
          {t('ConfirmAllOffers.notConfirmed')}{' '}
          <WhyNotAnsweredInThePortal error={confirming.error} />
        </p>
      )}
    </div>
  );
}

// What confirm-all did, once the API has answered: how many Offers it
// confirmed, a sentence that counts, in Confirmed Green at weight 500 after a
// double tick. It is announced when it appears, and stays after the banner
// has left, until the screen is left. It pushes what is below it down, so it
// arrives as a row does (the theme's `leaves`, Motion 8): its space, with the
// gap above it that the screen gives, opens first, and then it fades in, so
// that nothing below it jumps.
export function ConfirmedAll({
  confirming,
  gapAbove,
}: {
  confirming: Confirming;
  // The space the screen keeps above it, which opens with it.
  gapAbove?: string;
}) {
  const confirmed = confirming.data?.confirmed;

  return (
    <output
      data-testid={confirmed === undefined ? undefined : 'confirmed'}
      className="block"
    >
      {confirmed !== undefined && (
        <span data-arriving className="leaves">
          <span>
            <span
              className={cn(
                'flex items-center gap-2 text-sm font-medium text-success',
                gapAbove,
              )}
            >
              <CheckCheckIcon aria-hidden="true" className="size-4 shrink-0" />
              <span>
                <Trans
                  i18nKey="ConfirmAllOffers.confirmed"
                  count={confirmed}
                  components={{
                    count: (
                      <span data-testid="confirmed-count">{formatNumber(confirmed)}</span>
                    ),
                  }}
                />
              </span>
            </span>
          </span>
        </span>
      )}
    </output>
  );
}
