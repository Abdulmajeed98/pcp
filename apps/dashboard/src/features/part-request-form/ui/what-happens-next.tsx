import { PackagePlusIcon } from 'lucide-react';

import { useTranslation } from '@/shared/i18n';

// What happens to a request once it is sent, in three sentences, on Raised
// Stone with 8-pixel corners: what the Admin does with it, that the Offer
// is made with these details, confirmed as of the day it is sent, and that
// the request is followed under Part Requests. It is the form's own, so that
// every screen that opens the form shows it beside the form alike.
export function WhatHappensNext() {
  const { t } = useTranslation();

  return (
    <aside
      data-testid="what-happens-next"
      aria-labelledby="what-happens-next"
      className="flex min-w-0 flex-col gap-3 rounded-card bg-secondary p-4 text-sm"
    >
      <h2
        id="what-happens-next"
        className="flex items-center gap-2 text-base font-semibold"
      >
        <PackagePlusIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('NewPartRequest.nextTitle')}
      </h2>
      <p>{t('NewPartRequest.nextFound')}</p>
      <p>{t('NewPartRequest.nextOffer')}</p>
      <p>{t('NewPartRequest.nextFollowed')}</p>
    </aside>
  );
}
