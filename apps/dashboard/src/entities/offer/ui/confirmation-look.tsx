import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from 'lucide-react';

import { Trans, useTranslation } from '@/shared/i18n';
import type { Ended } from '@/shared/lib';

import type { ConfirmationState } from '../model/confirmation';

// Each state's mark and colour: confirmed today in Confirmed Green with a
// circled tick, an older Confirmation in Note Grey with a clock, and an
// Offer about to expire or expired in Action Red at weight 550, with a
// warning triangle and a circled cross, as what needs the Vendor's action.
// Each is also said in words.
const looks: Record<ConfirmationState['state'], { Icon: LucideIcon; className: string }> = {
  today: { Icon: CircleCheckIcon, className: 'text-success' },
  daysAgo: { Icon: ClockIcon, className: 'text-muted-foreground' },
  expiresIn: { Icon: TriangleAlertIcon, className: 'font-[550] text-destructive' },
  expiresToday: { Icon: TriangleAlertIcon, className: 'font-[550] text-destructive' },
  expired: { Icon: CircleXIcon, className: 'font-[550] text-destructive' },
};

// A Confirmation's mark and words, in its state's colour.
export function ConfirmationLook({
  state,
  className,
  testId,
  onTransitionEnd,
}: {
  state: ConfirmationState;
  className?: string;
  testId?: string;
  // What it listens to, as old words fading out (`unsettles`).
  onTransitionEnd?: (event: Ended) => void;
}) {
  const { Icon, className: look } = looks[state.state];

  return (
    <span
      data-testid={testId}
      data-state={testId === undefined ? undefined : state.state}
      aria-hidden={testId === undefined || undefined}
      onTransitionEnd={onTransitionEnd}
      className={cn('inline-flex items-center gap-1', look, className)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <ConfirmationWords state={state} />
    </span>
  );
}

function ConfirmationWords({ state }: { state: ConfirmationState }) {
  const { t } = useTranslation();

  switch (state.state) {
    case 'today':
      return <>{t('Offer.confirmedToday')}</>;
    case 'expiresToday':
      return <>{t('Offer.expiresToday')}</>;
    case 'daysAgo':
      return <Counted i18nKey="Offer.confirmedDaysAgo" count={state.count} />;
    case 'expiresIn':
      return <Counted i18nKey="Offer.expiresIn" count={state.count} />;
    case 'expired':
      return <Counted i18nKey="Offer.expired" count={state.count} />;
  }
}

// A sentence that counts days, with its count written by `formatNumber`.
function Counted({
  i18nKey,
  count,
}: {
  i18nKey: 'Offer.confirmedDaysAgo' | 'Offer.expiresIn' | 'Offer.expired';
  count: number;
}) {
  return (
    <span>
      <Trans
        i18nKey={i18nKey}
        count={count}
        components={{ count: <>{formatNumber(count)}</> }}
      />
    </span>
  );
}
