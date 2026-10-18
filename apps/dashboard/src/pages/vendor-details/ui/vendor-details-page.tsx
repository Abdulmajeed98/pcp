import type { VendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';

import {
  cityName,
  coordinatesOf,
  Detail,
  DetailList,
  googleMapsSearchFor,
  InANewTab,
  instagramHandleOf,
  instagramProfileOf,
  PhoneNumberShown,
  useVendor,
  useVendorShown,
  WrittenOnLines,
} from '@/entities/vendor';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

// The Vendor portal's first screen: every detail the platform holds about the
// Vendor whose portal is shown, in the portal's language, with a sentence
// that the Admin changes its name, its city and its login phone number.
//
// What the Vendor wrote, its name, its address and its opening hours, is
// shown as written, in its own direction and with its own digits (LANG-4).
// Its phone numbers, in Iraq's own form and in Western digits, and its
// Instagram name are English in every language, and are kept apart from the
// text around them (LANG-5). Its city is named in the shared terms. Its map
// location and its Instagram name open Google Maps and its profile, each in
// a new tab.
//
// The details are in three groups, as the Admin's Vendor form asks for
// them: the Vendor, its contact details, which ticket 08 lets it change, and
// its Login.
export function VendorDetailsPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const vendor = useVendor(vendorId);

  if (vendor.error) {
    return (
      <Alert variant="destructive" data-testid="refusal">
        <AlertTitle>{t('VendorDetails.notRead')}</AlertTitle>
        <AlertDescription>
          <WhyNotAnsweredInThePortal error={vendor.error} />
        </AlertDescription>
      </Alert>
    );
  }
  if (vendor.data === undefined) {
    return <p className="text-sm text-muted-foreground">{t('VendorDetails.reading')}</p>;
  }

  return <Details vendor={vendor.data} />;
}

function Details({ vendor }: { vendor: VendorResponse }) {
  const { t } = useTranslation();
  const none = <span className="text-muted-foreground">{t('VendorDetails.none')}</span>;
  const inANewTab = t('VendorDetails.inANewTab');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('VendorDetails.title')}</h1>
        <p data-testid="admin-changes" className="text-sm text-muted-foreground">
          {t('VendorDetails.adminChanges')}
        </p>
      </div>

      <DetailList>
        <Detail name="name" label={t('VendorDetails.name')}>
          <AsWritten>{vendor.name}</AsWritten>
        </Detail>
        <Detail name="city" label={t('VendorDetails.city')}>
          {cityName(vendor.city)}
        </Detail>
      </DetailList>

      <section aria-labelledby="contact-details" className="flex flex-col gap-2">
        <h2 id="contact-details" className="font-medium">
          {t('VendorDetails.contactDetails')}
        </h2>
        <DetailList>
          <Detail name="address" label={t('VendorDetails.address')}>
            <WrittenOnLines text={vendor.address} />
          </Detail>
          <Detail name="mapLocation" label={t('VendorDetails.mapLocation')}>
            {vendor.mapLocation === null ? (
              none
            ) : (
              <span className="flex flex-col items-start gap-1">
                <AlwaysEnglish>{coordinatesOf(vendor.mapLocation)}</AlwaysEnglish>
                <InANewTab
                  href={googleMapsSearchFor(vendor.mapLocation)}
                  inANewTab={inANewTab}
                >
                  {t('VendorDetails.openInGoogleMaps')}
                </InANewTab>
              </span>
            )}
          </Detail>
          <Detail name="phoneNumber" label={t('VendorDetails.phoneNumber')}>
            <PhoneNumberShown number={vendor.phoneNumber} none={none} />
          </Detail>
          <Detail name="whatsAppNumber" label={t('VendorDetails.whatsAppNumber')}>
            <PhoneNumberShown number={vendor.whatsAppNumber} none={none} />
          </Detail>
          <Detail name="instagramName" label={t('VendorDetails.instagramName')}>
            {vendor.instagramName === null ? (
              none
            ) : (
              <InANewTab
                href={instagramProfileOf(vendor.instagramName)}
                inANewTab={inANewTab}
              >
                <AlwaysEnglish>{instagramHandleOf(vendor.instagramName)}</AlwaysEnglish>
              </InANewTab>
            )}
          </Detail>
          <Detail name="openingHours" label={t('VendorDetails.openingHours')}>
            {vendor.openingHours === null ? (
              none
            ) : (
              <WrittenOnLines text={vendor.openingHours} />
            )}
          </Detail>
        </DetailList>
      </section>

      <section aria-labelledby="login" className="flex flex-col gap-2">
        <h2 id="login" className="font-medium">
          {t('VendorDetails.login')}
        </h2>
        <DetailList>
          <Detail name="loginPhoneNumber" label={t('VendorDetails.loginPhoneNumber')}>
            <PhoneNumberShown number={vendor.loginPhoneNumber} none={none} />
          </Detail>
        </DetailList>
      </section>
    </div>
  );
}
