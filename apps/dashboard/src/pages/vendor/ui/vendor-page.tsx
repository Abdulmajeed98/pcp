import type { PhoneNumberResponse, VendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { ExternalLinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import {
  cityName,
  coordinatesOf,
  DeactivatedMark,
  googleMapsSearchFor,
  useVendor,
} from '@/entities/vendor';
import { Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// A Vendor's page: every detail the platform holds about it, and whether it
// is deactivated. What the Vendor wrote, its name, its address and its
// opening hours, is shown as written, in its own direction (LANG-4). Its
// phone numbers, in Iraq's own form, and its Instagram name are English in
// every language, and are kept apart from the text around them. Its map
// location opens Google Maps' search for its coordinates.
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

  return <VendorDetails vendor={vendor.data} />;
}

function VendorDetails({ vendor }: { vendor: VendorResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <h1 className="text-xl font-semibold sm:text-2xl">
          <AsWritten>{vendor.name}</AsWritten>
        </h1>
      </div>

      <dl className="divide-y divide-border border-y border-border text-sm">
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
              <a
                href={googleMapsSearchFor(vendor.mapLocation)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-control items-center gap-1 underline underline-offset-4 hover:decoration-2"
              >
                Open in Google Maps
                <span className="sr-only">, in a new tab</span>
                <ExternalLinkIcon aria-hidden="true" className="size-4" />
              </a>
            </span>
          )}
        </Detail>
        <Detail name="phoneNumber" label="Phone number">
          <PhoneNumber number={vendor.phoneNumber} />
        </Detail>
        <Detail name="whatsAppNumber" label="WhatsApp number">
          <PhoneNumber number={vendor.whatsAppNumber} />
        </Detail>
        <Detail name="instagramName" label="Instagram name">
          {vendor.instagramName === null ? (
            <None />
          ) : (
            <AlwaysEnglish>{vendor.instagramName}</AlwaysEnglish>
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
          <PhoneNumber number={vendor.loginPhoneNumber} />
        </Detail>
      </dl>
    </div>
  );
}

// One detail of the Vendor, under its English name, found by the name the
// API gives it.
function Detail({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-detail={name}
      className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-1 py-2.5"
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Text the Vendor wrote on one or more lines, kept on its lines, and laid
// out in its own direction, so that a Kurdish address is aligned right on
// the English page.
function WrittenOnLines({ text }: { text: string }) {
  return <AsWritten className="block whitespace-pre-line">{text}</AsWritten>;
}

// A phone number in Iraq's own form, or that the Vendor has none.
function PhoneNumber({ number }: { number: PhoneNumberResponse | null }) {
  return number === null ? <None /> : <AlwaysEnglish>{number.national}</AlwaysEnglish>;
}

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
