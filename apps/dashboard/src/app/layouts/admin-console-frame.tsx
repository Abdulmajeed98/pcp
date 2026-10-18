import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router';

import { logOut } from '@/shared/auth';
import { apiClient, dataOf } from '@/shared/api';
import { useWideScreen } from '@/shared/lib';
import { Button } from '@/shared/ui';

// The Admin console's sections, by their addresses.
const sections = [
  { to: '/catalog', name: 'Catalog' },
  { to: '/vendors', name: 'Vendors' },
];

// The frame: the part every screen of the Admin console shares. A quiet top
// bar names the console and holds the menu of its sections, and on its end
// side shows who the API says the caller is and the way to log out. The
// section the Admin is in is marked as the current one, in weight and on a
// Shelf ground. On a phone the sections are behind a menu button, and open
// below the bar; on a screen as wide as a desk's they are in the bar itself.
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
  const wide = useWideScreen();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh wrap-break-word">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          {!wide && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sections"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? 'sections' : undefined}
              className="-ms-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <XIcon aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
            </Button>
          )}
          <p className="shrink-0 font-semibold whitespace-nowrap">Admin console</p>
          {wide && <Sections className="ms-4 flex-row" />}
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
        {!wide && menuOpen && (
          <Sections
            className="flex-col border-t border-border px-2 py-2"
            onChosen={() => setMenuOpen(false)}
          />
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

// The menu of the sections: a link to each, 44 pixels high, the current one
// marked. Choosing one closes the menu on a phone.
function Sections({ className, onChosen }: { className: string; onChosen?: () => void }) {
  return (
    <nav id="sections" aria-label="Sections">
      <ul className={cn('flex gap-1', className)}>
        {sections.map(({ to, name }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onChosen}
              className={({ isActive }) =>
                cn(
                  'flex min-h-control items-center rounded-lg px-3 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive ? 'bg-secondary font-semibold' : 'text-muted-foreground',
                )
              }
            >
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
