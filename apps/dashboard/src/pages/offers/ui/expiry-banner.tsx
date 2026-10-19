import type { VendorsOfferCountsResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { TriangleAlertIcon } from 'lucide-react';

import { ConfirmAllButton, type useConfirmAllOffers } from '@/features/confirm-all-offers';
import { Trans, useTranslation } from '@/shared/i18n';

// The banner at the head of the Offers screen, shown only while one of the
// Vendor's Offers is expired or about to expire (OFF-8). It says how many of
// each, each in a sentence that counts and only when there is one, and holds
// the button that confirms them all (OFF-5). It is a Sheet panel with an
// Action Red edge, because it is what needs the Vendor's action, and it is
// said in words, never in colour alone.
export function ExpiryBanner({
  counts,
  confirming,
}: {
  counts: VendorsOfferCountsResponse;
  confirming: ReturnType<typeof useConfirmAllOffers>;
}) {
  const { t } = useTranslation();
  if (counts.expired === 0 && counts.aboutToExpire === 0) return null;

  return (
    <section
      data-testid="expiry-banner"
      aria-labelledby="expiry-banner-title"
      className="flex flex-col gap-3 rounded-lg border border-destructive bg-card p-3"
    >
      <div className="flex gap-2">
        <TriangleAlertIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="flex flex-col gap-1">
          <h2 id="expiry-banner-title" className="text-base font-medium text-destructive">
            {t('ExpiryBanner.title')}
          </h2>
          {counts.expired > 0 && (
            <p className="text-sm">
              <Trans
                i18nKey="ExpiryBanner.expired"
                count={counts.expired}
                components={{
                  count: (
                    <strong data-testid="expired-count" className="font-semibold">
                      {formatNumber(counts.expired)}
                    </strong>
                  ),
                }}
              />
            </p>
          )}
          {counts.aboutToExpire > 0 && (
            <p className="text-sm">
              <Trans
                i18nKey="ExpiryBanner.aboutToExpire"
                count={counts.aboutToExpire}
                components={{
                  count: (
                    <strong data-testid="about-to-expire-count" className="font-semibold">
                      {formatNumber(counts.aboutToExpire)}
                    </strong>
                  ),
                }}
              />
            </p>
          )}
          <p className="text-sm text-muted-foreground">{t('ExpiryBanner.explanation')}</p>
        </div>
      </div>
      <ConfirmAllButton confirming={confirming} />
    </section>
  );
}
