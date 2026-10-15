import { useTranslation } from '@/shared/i18n';
import { CallerPanel } from '@/widgets/caller';

// Placeholder: scaffolding, not a screen. The Vendor portal's first real page
// replaces it. It is in the Vendor's language, inside the Vendor portal's
// frame.
export function VendorPortalPlaceholderPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <p data-testid="placeholder-notice">{t('VendorPortalPlaceholder.notice')}</p>
      <CallerPanel />
    </div>
  );
}
