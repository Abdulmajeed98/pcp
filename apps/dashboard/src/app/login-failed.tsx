import { useTranslation } from '@/shared/i18n';

// What the dashboard shows when the login could not be completed. Nobody is
// known yet, so it follows the Vendor portal's rule for its language, the
// language chosen with the switch first.
export function LoginFailed() {
  const { t } = useTranslation();

  return (
    <p data-testid="login-failed" className="m-4">
      {t('LoginFailed.message')}
    </p>
  );
}
