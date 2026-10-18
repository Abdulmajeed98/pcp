import type { VendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import type { ReactNode } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

import {
  isRefusedAsDeactivated,
  useCallersVendor,
  type VendorShown,
} from '@/entities/vendor';
import { logOut } from '@/shared/auth';
import { Refusal, WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui';

import { LanguageSwitch } from './language-switch';

// The Vendor portal's frame, for a Vendor's own Login: it asks the API for
// the Caller's own Vendor, and draws the portal's frame around it.
//
// A Login with no Vendor behind it, such as one made by hand in Keycloak's
// console, gets a plain message in the portal's language with the way to log
// out, and a top bar with the language switch alone, so that the message can
// be read in another language, as the owner chose on 18 October 2026.
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
    return <PlainMessage testId="no-vendor" message={t('VendorPortalFrame.noVendor')} />;
  }
  if (isRefusedAsDeactivated(vendor.error)) {
    return (
      <PlainMessage
        testId="vendor-deactivated"
        message={t('VendorPortalFrame.deactivated')}
      />
    );
  }

  return <PortalFrame vendor={vendor} />;
}

// A plain message in the portal's language in place of the portal, with a top
// bar that holds the language switch alone, and the way to log out.
function PlainMessage({ testId, message }: { testId: string; message: string }) {
  const { t } = useTranslation();

  return (
    <Frame>
      <header className="flex justify-end border-b border-border pb-2">
        <LanguageSwitch label={t('VendorPortalFrame.languageSwitch')} />
      </header>
      <main className="flex flex-col items-start gap-4 pt-4 sm:pt-6">
        <p data-testid={testId}>{message}</p>
        <LogOut />
      </main>
    </Frame>
  );
}

// The Vendor a frame shows, as far as the API has answered: the Vendor, once
// it is read, or why it could not be.
export interface VendorAskedFor {
  data?: VendorResponse;
  error: Error | null;
}

// The frame: the part every screen of the Vendor portal shares, whichever
// Vendor it shows and however it learnt which. It is laid out for a phone 360
// pixels wide first, and on a wider screen it gives the screen more room, up
// to a width that still reads well. A word too long for the screen is
// broken, so that it cannot make the page scroll sideways.
//
// Its top bar, closed by a Rule Sand rule, names the Vendor, as written, on
// the start side, and holds the way to log out and the language switch on
// the end side, the switch last, where a Vendor finds it on every screen:
// the right in English, and the left in Kurdish and Arabic. On a phone the
// name shares its row with the way to log out, and the switch has the row
// below; on a wider screen the three share one. It hands the Vendor to the
// screen below it, which reads the Vendor's details itself.
//
// While the Admin acts as a Vendor, a band above it names the Vendor.
export function PortalFrame({
  vendor,
  band,
}: {
  vendor: VendorAskedFor;
  band?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <>
      {band}
      <Frame>
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-2">
          <p className="min-w-0 flex-1 font-semibold">
            {vendor.data !== undefined && (
              <AsWritten data-testid="vendor-name">{vendor.data.name}</AsWritten>
            )}
          </p>
          <LogOut />
          <div className="flex w-full justify-end sm:w-auto">
            <LanguageSwitch label={t('VendorPortalFrame.languageSwitch')} />
          </div>
        </header>
        <main className="pt-4 sm:pt-6">
          {vendor.error ? (
            <Alert variant="destructive" data-testid="refusal">
              <AlertTitle>{t('VendorPortalFrame.notOpened')}</AlertTitle>
              <AlertDescription>
                <WhyNotAnsweredInThePortal error={vendor.error} />
              </AlertDescription>
            </Alert>
          ) : vendor.data === undefined ? (
            <p className="text-sm text-muted-foreground">
              {t('VendorPortalFrame.opening')}
            </p>
          ) : (
            <Outlet context={{ vendorId: vendor.data.id } satisfies VendorShown} />
          )}
        </main>
        <ScrollRestoration />
      </Frame>
    </>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="frame"
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-2 wrap-break-word sm:px-6"
    >
      {children}
    </div>
  );
}

// The way to log out, in the portal's language, outlined as every action but
// a pane's main one is.
function LogOut() {
  const { t } = useTranslation();

  return (
    <Button variant="outline" data-testid="log-out" onClick={() => void logOut()}>
      {t('VendorPortalFrame.logOut')}
    </Button>
  );
}
