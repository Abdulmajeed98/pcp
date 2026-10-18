import { Link } from 'react-router';

import { useTranslation } from '@/shared/i18n';
import { buttonVariants } from '@/shared/ui';

// What the Vendor portal shows, in its own language, at an address that
// matches none of its screens, such as one of the Admin console's. Its link
// is relative to the portal's own first address, so that it leads to the
// details screen wherever the portal's screens are mounted.
export function PortalNotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">{t('PortalNotFound.title')}</h1>
      <p>{t('PortalNotFound.message')}</p>
      <Link to=".." className={buttonVariants({ variant: 'outline' })}>
        {t('PortalNotFound.openDetails')}
      </Link>
    </div>
  );
}
