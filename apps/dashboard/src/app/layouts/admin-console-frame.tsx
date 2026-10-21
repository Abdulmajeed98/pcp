import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import {
  ClipboardListIcon,
  ClockAlertIcon,
  type LucideIcon,
  PackageSearchIcon,
  StoreIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router';

import { logOut } from '@/shared/auth';
import { apiClient, dataOf } from '@/shared/api';
import { useWideScreen } from '@/shared/lib';
import { Button, MenuSheet, ScreenSearchPlaceProvider } from '@/shared/ui';

import { SchemeSwitch } from './scheme-switch';

// The Admin console's sections, by their addresses, each with its icon.
const sections: { to: string; name: string; Icon: LucideIcon }[] = [
  { to: '/catalog', name: 'Catalog', Icon: PackageSearchIcon },
  { to: '/vendors', name: 'Vendors', Icon: StoreIcon },
  {
    to: '/missing-specifications',
    name: 'Missing specifications',
    Icon: ClipboardListIcon,
  },
  { to: '/expiring-offers', name: 'Expiring Offers', Icon: ClockAlertIcon },
];

// The surface's name. No logo is decided (PRODUCT.md's Brand Commitments).
const surface = 'Admin console';

// The frame: the part every screen of the Admin console shares, as the
// dashboard's DESIGN.md lays it out (Framed sheet, ADR-0011).
//
// From 64rem, one Stone Frame holds the sidebar on the start side, with the
// surface's name and the sections, and the top bar along the top, with the
// screen's search in its centre, if the screen has one, and on the end side
// the caller's name, the scheme switch and Log out. The screen lies on a
// white sheet set into the frame, inset 8 pixels from the window's end and
// bottom edges.
//
// Below 64rem the sheet is the screen: one bar on the Stone Frame holds the
// menu button and the surface's name, and the menu sheet holds the sections,
// the caller's name, the scheme switch and Log out.
//
// A word too long for the screen is broken, so that it cannot make the page
// scroll sideways. A new address starts at the top of its screen, and the
// browser's back button returns to where the Admin was.
export function AdminConsoleFrame() {
  const wide = useWideScreen();
  // Who the API says the caller is, asked for as the console opens.
  const caller = useQuery({
    queryKey: ['caller'],
    queryFn: () => dataOf(apiClient.getCaller()),
  });
  const callerName = caller.data?.loginName;

  return (
    <>
      {wide ? <OnADesk callerName={callerName} /> : <OnAPhone callerName={callerName} />}
      <ScrollRestoration />
    </>
  );
}

function OnADesk({ callerName }: { callerName: string | undefined }) {
  // Where the screen's search goes, in the top bar's centre.
  const [searchPlace, setSearchPlace] = useState<HTMLElement | null>(null);

  return (
    <div className="grid min-h-dvh grid-cols-[14.25rem_minmax(0,1fr)] grid-rows-[3rem_1fr] bg-frame wrap-break-word">
      <div className="sticky top-0 row-span-2 flex h-dvh flex-col gap-5 self-start overflow-y-auto px-3 pt-1.5 pb-4">
        <p className="flex min-h-control items-center px-3 font-semibold">{surface}</p>
        <Sections />
      </div>
      <header className="grid grid-cols-[minmax(0,1fr)_minmax(0,34.25rem)_minmax(max-content,1fr)] items-center gap-4 pe-2">
        <div />
        <div ref={setSearchPlace} className="min-w-0" />
        <div className="flex min-w-0 items-center justify-end gap-3">
          <CallerName name={callerName} className="max-w-48" />
          <SchemeSwitch />
          <LogOut />
        </div>
      </header>
      <main className="me-2 mb-2 min-w-0 rounded-sheet border border-border bg-background p-6">
        <div className="max-w-[80rem]">
          <ScreenSearchPlaceProvider place={searchPlace}>
            <Outlet />
          </ScreenSearchPlaceProvider>
        </div>
      </main>
    </div>
  );
}

function OnAPhone({ callerName }: { callerName: string | undefined }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background wrap-break-word">
      <header className="flex h-14 items-center gap-2 bg-frame px-4">
        <MenuSheet
          label="Sections"
          title={surface}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <Sections onChosen={() => setMenuOpen(false)} />
          <div className="mt-auto flex flex-col items-start gap-3">
            <CallerName name={callerName} />
            <SchemeSwitch />
            <LogOut className="-ms-3.5" />
          </div>
        </MenuSheet>
        <p className="min-w-0 flex-1 truncate text-center font-semibold">{surface}</p>
        <span aria-hidden="true" className="size-control shrink-0" />
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}

// The sections: a link to each, as high as a control, with its icon and its
// name in Note Grey, and the one the Admin is in on Active Stone, in Ink at
// weight 600. Choosing one closes the menu sheet on a phone.
function Sections({ onChosen }: { onChosen?: () => void }) {
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-0.5">
        {sections.map(({ to, name, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onChosen}
              className={({ isActive }) =>
                cn(
                  'hover-colour flex min-h-control items-center gap-2.5 rounded-control px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-accent font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Who the API says the caller is, in Note Grey, once it has answered.
function CallerName({ name, className }: { name: string | undefined; className?: string }) {
  if (name === undefined) return null;

  return (
    <span
      data-testid="caller-name"
      className={cn('truncate text-sm text-muted-foreground', className)}
    >
      {name}
    </span>
  );
}

// The way to log out, a quiet ghost button, last in the top bar. In the
// menu sheet its words start on the sheet's edge, as the caller's name and
// the switch do.
function LogOut({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      data-testid="log-out"
      className={className}
      onClick={() => void logOut()}
    >
      Log out
    </Button>
  );
}
