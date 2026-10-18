import type { EditContactDetailsRequest, VendorResponse } from '@pcp/api-client';

import { coordinatesOf, mapLocationIn } from '@/entities/vendor';

// What the form holds while the Vendor changes its contact details: each as
// typed, the map location as its coordinates are written. An optional detail
// left empty is not given.
export interface ContactDetailsFormValues {
  address: string;
  mapLocation: string;
  phoneNumber: string;
  whatsAppNumber: string;
  instagramName: string;
  openingHours: string;
}

// The form filled with the Vendor's contact details as they are: its phone
// numbers in Iraq's own form, which the API reads again, and its Instagram
// name bare.
export function contactDetailsFormValuesOf(
  vendor: VendorResponse,
): ContactDetailsFormValues {
  return {
    address: vendor.address,
    mapLocation: vendor.mapLocation === null ? '' : coordinatesOf(vendor.mapLocation),
    phoneNumber: vendor.phoneNumber.national,
    whatsAppNumber: vendor.whatsAppNumber?.national ?? '',
    instagramName: vendor.instagramName ?? '',
    openingHours: vendor.openingHours ?? '',
  };
}

// What the API is sent: the six contact details and nothing else, each as
// typed, for the API to read and check. An optional one left empty is sent
// as null, which clears it. The form has checked that the map location's
// text is coordinates.
export function contactDetailsRequestOf(
  values: ContactDetailsFormValues,
): EditContactDetailsRequest {
  return {
    address: values.address,
    mapLocation: mapLocationIn(values.mapLocation) ?? null,
    phoneNumber: values.phoneNumber,
    whatsAppNumber: givenOrNull(values.whatsAppNumber),
    instagramName: givenOrNull(values.instagramName),
    openingHours: givenOrNull(values.openingHours),
  };
}

function givenOrNull(text: string): string | null {
  return text.trim() === '' ? null : text;
}
