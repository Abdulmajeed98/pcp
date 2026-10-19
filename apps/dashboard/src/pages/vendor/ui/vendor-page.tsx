import type { VendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  cityName,
  coordinatesOf,
  DeactivatedMark,
  Detail,
  DetailList,
  googleMapsSearchFor,
  instagramHandleOf,
  instagramProfileOf,
  PhoneNumberShown,
  useVendor,
  WrittenOnLines,
} from '@/entities/vendor';
import { HandOver, TemporaryPassword } from '@/features/hand-over';
import { ResetPassword } from '@/features/reset-password';
import { VendorActivation } from '@/features/vendor-activation';
import { Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BackLink,
  buttonVariants,
  InANewTab,
} from '@/shared/ui';

// A Vendor's page: every detail the platform holds about it, and whether it
// is deactivated. What the Vendor wrote, its name, its address and its
// opening hours, is shown as written, in its own direction (LANG-4). Its
// phone numbers, in Iraq's own form, and its Instagram name are English in
// every language, and are kept apart from the text around them. Its map
// location opens Google Maps' search for its coordinates, and its Instagram
// name, written with an @ as Instagram writes a handle, opens its profile,
// each in a new tab, so that the Admin console stays where it was. Links
// below its name open its edit form and the Vendor's portal, for the
// Admin to act as it, beside a button that resets the Vendor's password,
// after which the screen shows the new temporary password, this once, and
// the hand-over. Below them the Admin deactivates or reactivates it.
export function VendorPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { vendorId = '' } = useParams();
  const vendor = useVendor(vendorId);

  if (vendor.error instanceof Refusal && vendor.error.status === 404) {
    return <VendorNotFound />;
  }
  if (vendor.error) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Vendor could not be read.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={vendor.error} />
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (vendor.data === undefined) {
    return <p className="text-sm text-muted-foreground">Reading the Vendor…</p>;
  }

  // Another Vendor's page is another screen: a password reset on one is not
  // shown on the next.
  return <VendorDetails key={vendor.data.id} vendor={vendor.data} />;
}

function VendorDetails({ vendor }: { vendor: VendorResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  // The temporary password of the last reset, held by this screen alone:
  // leaving it loses the password, and the API answers it nowhere else.
  const [resetPassword, setResetPassword] = useState<string>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <h1 className="text-xl font-semibold sm:text-2xl">
          <AsWritten>{vendor.name}</AsWritten>
        </h1>
        <div className="flex flex-wrap items-start gap-2">
          <Link
            to={keepingTheQuery(`/vendors/${vendor.id}/edit`)}
            className={buttonVariants({ variant: 'outline' })}
          >
            <PencilIcon data-icon="inline-start" aria-hidden="true" />
            Edit
          </Link>
          <Link
            to={`/vendors/${vendor.id}/portal`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Open its portal
          </Link>
          <ResetPassword
            vendorId={vendor.id}
            vendorName={vendor.name}
            onReset={setResetPassword}
          />
        </div>
        {/* Its own for each Vendor, so that one Vendor's refusal is never shown on another's page. */}
        <VendorActivation key={vendor.id} vendor={vendor} />
      </div>

      {resetPassword !== undefined && (
        <div className="flex flex-col gap-6">
          <p>The password is reset, and the Vendor is logged out.</p>
          <TemporaryPassword password={resetPassword} />
          <HandOver
            loginPhoneNumber={vendor.loginPhoneNumber}
            temporaryPassword={resetPassword}
          />
        </div>
      )}

      <DetailList>
        <Detail name="state" label="State">
          {vendor.active ? 'Active' : <DeactivatedMark />}
        </Detail>
        <Detail name="city" label="City">
          {cityName(vendor.city)}
        </Detail>
        <Detail name="address" label="Address">
          <WrittenOnLines text={vendor.address} />
        </Detail>
        <Detail name="mapLocation" label="Map location">
          {vendor.mapLocation === null ? (
            <None />
          ) : (
            <span className="flex flex-col items-start gap-1">
              <AlwaysEnglish>{coordinatesOf(vendor.mapLocation)}</AlwaysEnglish>
              <InANewTab
                href={googleMapsSearchFor(vendor.mapLocation)}
                inANewTab={inANewTab}
              >
                Open in Google Maps
              </InANewTab>
            </span>
          )}
        </Detail>
        <Detail name="phoneNumber" label="Phone number">
          <PhoneNumberShown number={vendor.phoneNumber} none={<None />} />
        </Detail>
        <Detail name="whatsAppNumber" label="WhatsApp number">
          <PhoneNumberShown number={vendor.whatsAppNumber} none={<None />} />
        </Detail>
        <Detail name="instagramName" label="Instagram name">
          {vendor.instagramName === null ? (
            <None />
          ) : (
            <InANewTab
              href={instagramProfileOf(vendor.instagramName)}
              inANewTab={inANewTab}
            >
              <AlwaysEnglish>{instagramHandleOf(vendor.instagramName)}</AlwaysEnglish>
            </InANewTab>
          )}
        </Detail>
        <Detail name="openingHours" label="Opening hours">
          {vendor.openingHours === null ? (
            <None />
          ) : (
            <WrittenOnLines text={vendor.openingHours} />
          )}
        </Detail>
        <Detail name="loginPhoneNumber" label="Login phone number">
          <PhoneNumberShown number={vendor.loginPhoneNumber} none={<None />} />
        </Detail>
      </DetailList>
    </div>
  );
}

// What a screen reader says after a link that opens another site.
const inANewTab = ', in a new tab';

// A detail the Vendor may leave out, and has.
function None() {
  return <span className="text-muted-foreground">None</span>;
}

function VendorNotFound() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">Vendor not found</h1>
      <p>The platform holds no Vendor at this address. It may never have existed.</p>
    </div>
  );
}
