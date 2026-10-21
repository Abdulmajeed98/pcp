import type { VendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import {
  cityName,
  coordinatesOf,
  Detail,
  DetailList,
  googleMapsSearchFor,
  instagramHandleOf,
  instagramProfileOf,
  PhoneNumberShown,
  useVendor,
  useVendorShown,
  WrittenOnLines,
} from '@/entities/vendor';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  buttonVariants,
  InANewTab,
} from '@/shared/ui';

// The Vendor portal's details screen, the second of its sections, at
// `details`: every detail the platform holds about the Vendor whose portal is
// shown, in the portal's language, with a sentence that the Admin changes its
// name, its city and its login phone number.
//
// What the Vendor wrote, its name, its address and its opening hours, is
// shown as written, in its own direction and with its own digits (LANG-4).
// Its phone numbers, in Iraq's own form and in Western digits, and its
// Instagram name are English in every language, and are kept apart from the
// text around them (LANG-5). Its city is named in the shared terms. Its map
// location and its Instagram name open Google Maps and its profile, each in
// a new tab.
//
// As the dashboard's DESIGN.md lays out a Vendor's details, they are in three
// groups, as the Admin's Vendor form asks for them, each after its heading in
// the Section type: the Vendor, its contact details, which it changes itself
// from the link beside their heading, and its Login. The link says "Edit", as
// the owner chose on 18 October 2026, and the heading is its description. The
// link is relative to the route, so that it leads to the form under either
// frame.
//
// While the Vendor is being read, the screen is already drawn: its title, the
// groups' headings and each detail's name, with each value sketched in Raised
// Stone, still, and a sentence for a screen reader that says it is reading.
// The values then take the sketches' places in one frame, with nothing
// moving (DESIGN.md's Motion, 9). A Vendor that could not be read is said
// below the title, in the refusal panel.
export function VendorDetailsPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const vendor = useVendor(vendorId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="screen-title">{t('VendorDetails.title')}</h1>
        <p data-testid="admin-changes" className="text-sm text-muted-foreground">
          {t('VendorDetails.adminChanges')}
        </p>
      </div>
      {vendor.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('VendorDetails.notRead')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={vendor.error} />
          </AlertDescription>
        </Alert>
      ) : (
        <Details vendor={vendor.data} />
      )}
    </div>
  );
}

function Details({ vendor }: { vendor: VendorResponse | undefined }) {
  const { t } = useTranslation();
  const none = <span className="text-muted-foreground">{t('VendorDetails.none')}</span>;
  const inANewTab = t('VendorDetails.inANewTab');
  // A detail's value once the Vendor is read, and its sketch until then.
  const shown = (value: (read: VendorResponse) => ReactNode) =>
    vendor === undefined ? <Sketched /> : value(vendor);

  return (
    <div aria-busy={vendor === undefined || undefined} className="flex flex-col gap-8">
      {vendor === undefined && (
        <output className="sr-only">{t('VendorDetails.reading')}</output>
      )}

      <Group id="details-vendor" heading={t('VendorDetails.vendor')}>
        <DetailList>
          <Detail name="name" label={t('VendorDetails.name')}>
            {shown((read) => (
              <AsWritten>{read.name}</AsWritten>
            ))}
          </Detail>
          <Detail name="city" label={t('VendorDetails.city')}>
            {shown((read) => cityName(read.city))}
          </Detail>
        </DetailList>
      </Group>

      <Group
        id="contact-details"
        heading={t('VendorDetails.contactDetails')}
        action={
          <Link
            to="contact-details"
            aria-describedby="contact-details"
            className={buttonVariants({ variant: 'outline' })}
          >
            {t('VendorDetails.edit')}
          </Link>
        }
      >
        <DetailList>
          <Detail name="address" label={t('VendorDetails.address')}>
            {shown((read) => (
              <WrittenOnLines text={read.address} />
            ))}
          </Detail>
          <Detail name="mapLocation" label={t('VendorDetails.mapLocation')}>
            {shown((read) =>
              read.mapLocation === null ? (
                none
              ) : (
                <span className="flex flex-col items-start">
                  <AlwaysEnglish>{coordinatesOf(read.mapLocation)}</AlwaysEnglish>
                  <OnTheRowsLines last>
                    <InANewTab
                      href={googleMapsSearchFor(read.mapLocation)}
                      inANewTab={inANewTab}
                    >
                      {t('VendorDetails.openInGoogleMaps')}
                    </InANewTab>
                  </OnTheRowsLines>
                </span>
              ),
            )}
          </Detail>
          <Detail name="phoneNumber" label={t('VendorDetails.phoneNumber')}>
            {shown((read) => (
              <PhoneNumberShown number={read.phoneNumber} none={none} />
            ))}
          </Detail>
          <Detail name="whatsAppNumber" label={t('VendorDetails.whatsAppNumber')}>
            {shown((read) => (
              <PhoneNumberShown number={read.whatsAppNumber} none={none} />
            ))}
          </Detail>
          <Detail name="instagramName" label={t('VendorDetails.instagramName')}>
            {shown((read) =>
              read.instagramName === null ? (
                none
              ) : (
                <OnTheRowsLines>
                  <InANewTab
                    href={instagramProfileOf(read.instagramName)}
                    inANewTab={inANewTab}
                  >
                    <AlwaysEnglish>{instagramHandleOf(read.instagramName)}</AlwaysEnglish>
                  </InANewTab>
                </OnTheRowsLines>
              ),
            )}
          </Detail>
          <Detail name="openingHours" label={t('VendorDetails.openingHours')}>
            {shown((read) =>
              read.openingHours === null ? (
                none
              ) : (
                <WrittenOnLines text={read.openingHours} />
              ),
            )}
          </Detail>
        </DetailList>
      </Group>

      <Group id="details-login" heading={t('VendorDetails.login')}>
        <DetailList>
          <Detail name="loginPhoneNumber" label={t('VendorDetails.loginPhoneNumber')}>
            {shown((read) => (
              <PhoneNumberShown number={read.loginPhoneNumber} none={none} />
            ))}
          </Detail>
        </DetailList>
      </Group>
    </div>
  );
}

// One group of the details: its heading in the Section type, with an action
// beside it on the end side, or below it when the row is too narrow, and its
// details under it.
function Group({
  id,
  heading,
  action,
  children,
}: {
  id: string;
  heading: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id={id} className="text-base font-semibold">
          {heading}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// A link in a detail's value, as high as a control so that a thumb finds it,
// drawn on the row's line of text: it reaches into the row's padding above
// and below its words (or only below, when it is the value's last line under
// another), so that its words stand level with the detail's name and the row
// keeps its height (Emil's break-ui, the redesign's ticket 13).
function OnTheRowsLines({
  last = false,
  children,
}: {
  last?: boolean;
  children: ReactNode;
}) {
  return <span className={last ? 'flex -mb-3' : 'flex -my-3'}>{children}</span>;
}

// A value not read yet: one line's height, sketched in Raised Stone, still.
function Sketched() {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-2/3 max-w-60 rounded-plate bg-secondary"
    />
  );
}
