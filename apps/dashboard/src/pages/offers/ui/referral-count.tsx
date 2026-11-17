import { formatNumber } from '@pcp/i18n';
import { SendIcon } from 'lucide-react';

import { useReferralCount } from '@/entities/vendor';
import { Trans, useTranslation } from '@/shared/i18n';
import { ChangingInPlace } from '@/shared/ui';

// The Vendor's Referral count: one Note Grey line under the Offers screen's
// title, above the banner, that says how many times Shoppers have sent the
// Vendor their Build on WhatsApp, in the portal's language (SHR-7). The owner
// chose its place and its plain words, and that it is said at none too, on
// 17 November 2026, from the renderings of sharing ticket 03: "all
// recommendations with proper motions". The Offers screen is where the
// Vendor confirms, so the count stands beside the work it rewards. It is
// words, with the count in Ink at weight 600 and never on a plate, and the
// paper plane before it points the reading way, mirrored right to left.
//
// It is read by a query of its own, so it does not wait for the Offers. While
// it is read, the line's mark and a one-line sketch in Raised Stone hold its
// place, still. The sentence then takes the sketch's place as a value does
// (DESIGN.md's Motion, 6 and 10): it fades in over the sketch fading out,
// while the line's height follows from the sketch's to its own, so that the
// banner and the list below it move with it rather than jump; a later count
// changes the same way. A count already read, as on coming back to the
// screen, is drawn at once and nothing moves. A count that cannot be read is
// not guessed at: the line's space closes the same way, and the screen says
// nothing of it.
export function ReferralCount({ vendorId }: { vendorId: string }) {
  const counted = useReferralCount(vendorId);
  const count = counted.data?.count;
  const changeKey = counted.error
    ? 'not-read'
    : count === undefined
      ? 'reading'
      : `counted-${count}`;

  return (
    <ChangingInPlace changeKey={changeKey} axis="height" data-testid="referrals">
      {counted.error ? null : (
        <p className="flex items-start gap-1.5 pt-2 text-sm text-muted-foreground">
          <SendIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 rtl:-scale-x-100"
          />
          {count === undefined ? <Sketched /> : <Said count={count} />}
        </p>
      )}
    </ChangingInPlace>
  );
}

// What the line says once the count is read: that no Shopper has sent the
// Vendor their Build yet, or how many times Shoppers have, with every plural
// form its language has. Arabic says one and two in words, as the portal's
// other counts do.
function Said({ count }: { count: number }) {
  const { t } = useTranslation();

  return (
    <span data-testid="referral-sentence">
      {count === 0 ? (
        <span data-testid="no-referrals">{t('OffersScreen.referredNone')}</span>
      ) : (
        <Trans
          i18nKey="OffersScreen.referred"
          count={count}
          components={{
            count: (
              <strong
                data-testid="referral-count"
                className="font-semibold text-foreground tabular-nums"
              >
                {formatNumber(count)}
              </strong>
            ),
          }}
        />
      )}
    </span>
  );
}

// The count not read yet: one line's height, sketched in Raised Stone, still.
function Sketched() {
  return (
    <span
      aria-hidden="true"
      data-testid="referrals-sketch"
      className="block h-5 w-2/3 max-w-80 rounded-plate bg-secondary"
    />
  );
}
