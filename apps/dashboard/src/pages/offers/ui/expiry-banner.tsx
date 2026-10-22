import type { VendorsOfferCountsResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { TriangleAlertIcon } from 'lucide-react';

import { ConfirmAllButton, type useConfirmAllOffers } from '@/features/confirm-all-offers';
import { Trans, useTranslation } from '@/shared/i18n';

// The banner at the head of the Offers screen, under its title and above the
// tabs, shown only while one of the Vendor's Offers is expired or about to
// expire (OFF-8; DESIGN.md's States). A Sheet panel with an Action Red border
// and 8-pixel corners, because it is what needs the Vendor's action: a
// warning triangle and its title in Action Red, then a sentence for each
// count that is not 0, the count at weight 650 and never on a plate, then a
// Note Grey sentence on what confirming means; and the pane's one primary
// button, which confirms them all (OFF-5), on the end side from 64rem and as
// wide as the panel on a phone. It is said in words, never in colour alone.
export function ExpiryBanner({
  counts,
  confirming,
}: {
  counts: VendorsOfferCountsResponse;
  confirming: ReturnType<typeof useConfirmAllOffers>;
}) {
  const { t } = useTranslation();

  return (
    <section
      data-testid="expiry-banner"
      aria-labelledby="expiry-banner-title"
      className="flex flex-col gap-4 rounded-card border border-destructive bg-card p-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6"
    >
      <div className="flex min-w-0 gap-2.5">
        <TriangleAlertIcon
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-destructive"
        />
        <div className="flex min-w-0 flex-col gap-1 text-sm">
          <h2 id="expiry-banner-title" className="text-base font-semibold text-destructive">
            {t('ExpiryBanner.title')}
          </h2>
          {counts.expired > 0 && (
            <p>
              <Trans
                i18nKey="ExpiryBanner.expired"
                count={counts.expired}
                components={{
                  count: (
                    <strong data-testid="expired-count" className="font-[650] tabular-nums">
                      {formatNumber(counts.expired)}
                    </strong>
                  ),
                }}
              />
            </p>
          )}
          {counts.aboutToExpire > 0 && (
            <p>
              <Trans
                i18nKey="ExpiryBanner.aboutToExpire"
                count={counts.aboutToExpire}
                components={{
                  count: (
                    <strong
                      data-testid="about-to-expire-count"
                      className="font-[650] tabular-nums"
                    >
                      {formatNumber(counts.aboutToExpire)}
                    </strong>
                  ),
                }}
              />
            </p>
          )}
          <p className="text-muted-foreground">{t('ExpiryBanner.explanation')}</p>
        </div>
      </div>
      <ConfirmAllButton confirming={confirming} />
    </section>
  );
}
