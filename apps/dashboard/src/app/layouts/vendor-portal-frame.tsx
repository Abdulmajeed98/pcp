import type { VendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import {
  CircleSlashIcon,
  type LucideIcon,
  PackageIcon,
  StoreIcon,
  UserXIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router';

import {
  isRefusedAsDeactivated,
  useCallersVendor,
  type VendorShown,
} from '@/entities/vendor';
import { logOut } from '@/shared/auth';
import { Refusal, WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { useCentredInTheWindow, useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Empty,
  EmptyHeader,
  EmptyMedia,
  MenuSheet,
  ScreenActionPlaceProvider,
  ScreenSearchPlaceProvider,
} from '@/shared/ui';

import { LanguageSwitch } from './language-switch';
import { SchemeSwitch } from './scheme-switch';

// The Vendor portal's frame, for a Vendor's own Login: it asks the API for
// the Caller's own Vendor, and draws the portal's frame around it.
//
// A Login with no Vendor behind it, such as one made by hand in Keycloak's
// console, gets a plain message in the portal's language, in the frame with
// no sections, so that the message can be read in another language and the
// Vendor can log out, as the owner chose on 18 October 2026.
//
// A deactivated Vendor gets a plain message of its own in the same frame,
// when the portal starts and, when the portal is already open, on its next
// call to the API: the API refuses that call, and every other, with
// `VENDOR_DEACTIVATED`, and the dashboard then asks for the Caller's Vendor
// again (see `query-client.ts`).
export function VendorPortalFrame() {
  const { t } = useTranslation();
  const vendor = useCallersVendor();

  if (vendor.error instanceof Refusal && vendor.error.code === 'VENDOR_NOT_FOUND') {
    return (
      <PlainMessage
        testId="no-vendor"
        message={t('VendorPortalFrame.noVendor')}
        Icon={UserXIcon}
      />
    );
  }
  if (isRefusedAsDeactivated(vendor.error)) {
    return (
      <PlainMessage
        testId="vendor-deactivated"
        message={t('VendorPortalFrame.deactivated')}
        Icon={CircleSlashIcon}
      />
    );
  }

  return <PortalFrame vendor={vendor} />;
}

// A plain message in the portal's language in place of the portal, on the
// frame's sheet, with the frame's switches and Log out and no sections. It
// is the dashboard's empty state, centred in the window's height as the
// "not found" screens are (redesign ticket 13): its icon plain, and its one
// sentence, in the Body type, with no heading and no action, since there is
// nothing to do here but read it, change the language or log out.
function PlainMessage({
  testId,
  message,
  Icon,
}: {
  testId: string;
  message: string;
  Icon: LucideIcon;
}) {
  const centred = useCentredInTheWindow<HTMLDivElement>();

  return (
    <Framed>
      <Empty ref={centred}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
          <p data-testid={testId}>{message}</p>
        </EmptyHeader>
      </Empty>
    </Framed>
  );
}

// The Vendor a frame shows, as far as the API has answered: the Vendor, once
// it is read, or why it could not be.
export interface VendorAskedFor {
  data?: VendorResponse;
  error: Error | null;
}

// The frame: the part every screen of the Vendor portal shares, whichever
// Vendor it shows and however it learnt which, as the dashboard's DESIGN.md
// lays it out (Framed sheet, ADR-0011). It names the Vendor as it writes it,
// and once the Vendor is read it holds the portal's sections and hands the
// Vendor to the screen below it, which reads the Vendor's details itself.
//
// While the Admin acts as a Vendor, a band across the whole window, above
// the frame, names the Vendor.
export function PortalFrame({
  vendor,
  band,
}: {
  vendor: VendorAskedFor;
  band?: ReactNode;
}) {
  const { t } = useTranslation();
  const name = vendor.data?.name;

  return (
    <Framed band={band} name={name} sections={vendor.data !== undefined}>
      {vendor.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('VendorPortalFrame.notOpened')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={vendor.error} />
          </AlertDescription>
        </Alert>
      ) : vendor.data === undefined ? (
        <p className="text-sm text-muted-foreground">{t('VendorPortalFrame.opening')}</p>
      ) : (
        <Outlet context={{ vendorId: vendor.data.id } satisfies VendorShown} />
      )}
    </Framed>
  );
}

// What the frame draws around a screen.
//
// From 64rem, one Stone Frame holds the sidebar on the start side, with the
// Vendor's name and "Vendor portal" at its head and the sections below, and
// the top bar along the top, with the screen's search in its centre, if the
// screen has one, and on the end side the language switch, the scheme switch
// and Log out, last. The screen lies on a white sheet set into the frame,
// inset 8 pixels from the window's end and bottom edges, which are the left
// and the bottom in Kurdish and Arabic.
//
// Below 64rem the sheet is the screen: one bar on the Stone Frame holds the
// menu button, the Vendor's name and, on the end side, the screen's one
// action if it gives one, such as Add an Offer; the menu sheet holds the
// sections, the language switch, the scheme switch and Log out.
//
// A word too long for the screen is broken, so that it cannot make the page
// scroll sideways. A new address starts at the top of its screen, and the
// browser's back button returns to where the Vendor was.
function Framed({
  band,
  name,
  sections = false,
  children,
}: {
  band?: ReactNode;
  // The Vendor's name, as it writes it, once it is read.
  name?: string;
  // Whether the frame holds the portal's sections.
  sections?: boolean;
  children: ReactNode;
}) {
  const wide = useWideScreen();
  const Layout = wide ? OnADesk : OnAPhone;

  return (
    <div data-testid="frame" className="flex min-h-dvh flex-col bg-frame wrap-break-word">
      {band}
      <Layout name={name} sections={sections}>
        {children}
      </Layout>
      <ScrollRestoration />
    </div>
  );
}

interface LayoutProps {
  name: string | undefined;
  sections: boolean;
  children: ReactNode;
}

function OnADesk({ name, sections, children }: LayoutProps) {
  const { t } = useTranslation();
  // Where the screen's search goes, in the top bar's centre.
  const [searchPlace, setSearchPlace] = useState<HTMLElement | null>(null);

  return (
    <div className="grid flex-1 grid-cols-[14.25rem_minmax(0,1fr)] grid-rows-[3rem_1fr]">
      <div className="sticky top-0 row-span-2 flex max-h-dvh flex-col gap-5 self-start overflow-y-auto px-3 pt-1.5 pb-4">
        <Scope name={name} />
        {sections && <Sections />}
      </div>
      <header className="grid grid-cols-[minmax(0,1fr)_minmax(0,34.25rem)_minmax(max-content,1fr)] items-center gap-4 pe-2">
        <div />
        <div ref={setSearchPlace} className="min-w-0" />
        <div className="flex min-w-0 items-center justify-end gap-3">
          <LanguageSwitch label={t('VendorPortalFrame.languageSwitch')} />
          <PortalSchemeSwitch />
          <LogOut />
        </div>
      </header>
      <main className="me-2 mb-2 min-w-0 rounded-sheet border border-border bg-background p-6">
        <div className="max-w-[80rem]">
          <ScreenSearchPlaceProvider place={searchPlace}>
            {children}
          </ScreenSearchPlaceProvider>
        </div>
      </main>
    </div>
  );
}

function OnAPhone({ name, sections, children }: LayoutProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Where the screen's one action goes, on the bar's end side.
  const [actionPlace, setActionPlace] = useState<HTMLElement | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-2 bg-frame px-4">
        <MenuSheet
          label={t('VendorPortalFrame.menu')}
          title={<ScopeInTheMenu name={name} />}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          {sections && <Sections onChosen={() => setMenuOpen(false)} />}
          <div className="mt-auto flex flex-col items-start gap-3">
            <LanguageSwitch label={t('VendorPortalFrame.languageSwitch')} />
            <PortalSchemeSwitch />
            <LogOut className="-ms-3.5" />
          </div>
        </MenuSheet>
        {/* The name is cut at its own end, in its own direction, so that a
            long name keeps its start (redesign ticket 11's break-ui). */}
        <p className="min-w-0 flex-1 text-center font-semibold">
          {name !== undefined && (
            <AsWritten data-testid="vendor-name" className="block truncate">
              {name}
            </AsWritten>
          )}
        </p>
        <div ref={setActionPlace} className="flex size-control shrink-0 justify-end" />
      </header>
      <main className="flex-1 bg-background p-4">
        <ScreenActionPlaceProvider place={actionPlace}>
          {children}
        </ScreenActionPlaceProvider>
      </main>
    </div>
  );
}

// The surface's name at the sidebar's head: the Vendor's name as it writes
// it, and "Vendor portal" below it in Note Grey. No logo is decided
// (PRODUCT.md's Brand Commitments). The name keeps its own direction inside
// a line of the portal's, so that it stands on the start side in every
// language (redesign ticket 11's break-ui).
function Scope({ name }: { name: string | undefined }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-control flex-col justify-center px-3">
      {name !== undefined && (
        <span className="font-semibold">
          <AsWritten data-testid="vendor-name">{name}</AsWritten>
        </span>
      )}
      <span className="text-sm text-muted-foreground">{t('VendorPortal.title')}</span>
    </div>
  );
}

// The same at the menu sheet's head, which it names.
function ScopeInTheMenu({ name }: { name: string | undefined }) {
  const { t } = useTranslation();

  return (
    <span className="flex flex-col">
      {name !== undefined && (
        <span>
          <AsWritten>{name}</AsWritten>
        </span>
      )}
      <span className="text-sm font-normal text-muted-foreground">
        {t('VendorPortal.title')}
      </span>
    </span>
  );
}

// The portal's sections: the Offers, its first screen, and the Vendor's
// details. Each is a link as high as a control, with its icon and its name
// in Note Grey, and the one the Vendor is in on Active Stone, in Ink at
// weight 600, as the Admin console's sections are. Their addresses are
// relative to the frame's route, so they lead to the same screens under
// either frame. Choosing one closes the menu sheet on a phone.
function Sections({ onChosen }: { onChosen?: () => void }) {
  const { t } = useTranslation();
  const sections: { to: string; end: boolean; name: string; Icon: LucideIcon }[] = [
    { to: '.', end: true, name: t('VendorPortalFrame.offers'), Icon: PackageIcon },
    { to: 'details', end: false, name: t('VendorPortalFrame.details'), Icon: StoreIcon },
  ];

  return (
    <nav aria-label={t('VendorPortalFrame.sections')}>
      <ul data-testid="portal-sections" className="flex flex-col gap-0.5">
        {sections.map(({ to, end, name, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
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

// The scheme switch, in the portal's language.
function PortalSchemeSwitch() {
  const { t } = useTranslation();

  return (
    <SchemeSwitch
      words={{
        label: t('VendorPortalFrame.scheme'),
        light: t('VendorPortalFrame.light'),
        dark: t('VendorPortalFrame.dark'),
        device: t('VendorPortalFrame.device'),
      }}
    />
  );
}

// The way to log out, in the portal's language, a quiet ghost button, last
// in the top bar. In the menu sheet its words start on the sheet's edge, as
// the switches do.
function LogOut({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      data-testid="log-out"
      className={className}
      onClick={() => void logOut()}
    >
      {t('VendorPortalFrame.logOut')}
    </Button>
  );
}
