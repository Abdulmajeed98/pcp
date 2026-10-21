import { SignpostIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useTranslation } from '@/shared/i18n';
import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/shared/ui';

// What the Vendor portal shows, in its own language, at an address that
// matches none of its screens, such as one of the Admin console's. As the
// Admin console's own "not found" screen, it is the dashboard's empty state,
// centred on the sheet between two Rule lines: its icon plain, its title the
// screen's, one sentence and an outlined link. The signpost is the same in
// both directions. It holds still as it opens, as every screen does
// (DESIGN.md's Motion, 9).
//
// Its link is relative to the portal's own first address, so that it leads
// to the Offers screen wherever the portal's screens are mounted.
export function PortalNotFoundPage() {
  const { t } = useTranslation();

  return (
    <Empty className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SignpostIcon aria-hidden="true" />
        </EmptyMedia>
        <h1 className="text-base font-semibold">{t('PortalNotFound.title')}</h1>
        <EmptyDescription>{t('PortalNotFound.message')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to=".." className={buttonVariants({ variant: 'outline' })}>
          {t('PortalNotFound.openOffers')}
        </Link>
      </EmptyContent>
    </Empty>
  );
}
