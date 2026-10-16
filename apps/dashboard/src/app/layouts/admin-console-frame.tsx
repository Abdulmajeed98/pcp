import { useQuery } from '@tanstack/react-query';
import { Outlet, ScrollRestoration } from 'react-router';

import { logOut } from '@/shared/auth';
import { apiClient, dataOf } from '@/shared/api';
import { Button } from '@/shared/ui';

// The frame: the part every screen of the Admin console shares. A quiet top
// bar names the console, and on its end side shows who the API says the
// caller is and the way to log out. The Catalog is the only section so far,
// so the bar has no menu of sections yet: it gains one with the second.
//
// Below the bar, the screen, laid out for a phone 360 pixels wide first. A
// word too long for the screen is broken, so that it cannot make the page
// scroll sideways. A new address starts at the top of its screen, and the
// browser's back button returns to where the Admin was.
export function AdminConsoleFrame() {
  const caller = useQuery({
    queryKey: ['caller'],
    queryFn: () => dataOf(apiClient.getCaller()),
  });

  return (
    <div className="min-h-dvh wrap-break-word">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
          <p className="shrink-0 font-semibold whitespace-nowrap">Admin console</p>
          <div className="ms-auto flex min-w-0 items-center gap-3">
            {caller.data !== undefined && (
              <span
                data-testid="caller-name"
                className="truncate text-sm text-muted-foreground"
              >
                {caller.data.loginName}
              </span>
            )}
            <Button variant="outline" data-testid="log-out" onClick={() => void logOut()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
