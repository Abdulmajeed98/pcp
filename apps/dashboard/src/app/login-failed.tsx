import { LogInIcon, RotateCwIcon } from 'lucide-react';

import { startLoginAgain } from '@/shared/auth';
import { useTranslation } from '@/shared/i18n';
import { Button, Empty, EmptyContent, EmptyHeader, EmptyMedia } from '@/shared/ui';

// What the dashboard shows when the login could not be completed. Nobody is
// known yet, so it follows the Vendor portal's rule for its language, the
// language chosen with the switch first, and it has no frame: the screen is
// the Sheet, with the dashboard's empty state centred on it, its icon plain,
// the message as its title, and Try again, which starts the login again from
// Keycloak. It holds still as it opens (DESIGN.md's Motion, 9); Try again is
// pressed as every button is (1).
export function LoginFailed() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh bg-background p-4 wrap-break-word">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LogInIcon aria-hidden="true" className="rtl:-scale-x-100" />
          </EmptyMedia>
          <h1 data-testid="login-failed" className="text-base font-semibold">
            {t('LoginFailed.message')}
          </h1>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => void startLoginAgain()}>
            <RotateCwIcon aria-hidden="true" />
            {t('LoginFailed.tryAgain')}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
