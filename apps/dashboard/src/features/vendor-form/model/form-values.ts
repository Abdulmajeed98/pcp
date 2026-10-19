import type { CreateVendorRequest, VendorResponse } from '@pcp/api-client';

import { type CityKey, coordinatesOf, mapLocationIn } from '@/entities/vendor';

// What the form holds while the Admin fills it in: every detail as typed,
// the map location as its coordinates are written. An optional detail left
// empty is not given.
export interface VendorFormValues {
  name: string;
  city: CityKey;
  address: string;
  mapLocation: string;
  phoneNumber: string;
  whatsAppNumber: string;
  instagramName: string;
  openingHours: string;
  loginPhoneNumber: string;
}

// The form for a new Vendor, with Erbil, the one city, already chosen.
export const newVendorFormValues: VendorFormValues = {
  name: '',
  city: 'erbil',
  address: '',
  mapLocation: '',
  phoneNumber: '',
  whatsAppNumber: '',
  instagramName: '',
  openingHours: '',
  loginPhoneNumber: '',
};

// The form filled with a Vendor's details as they are, for the Admin's edit:
// its phone numbers in Iraq's own form, which the API reads again, and its
// Instagram name bare.
export function vendorFormValuesOf(vendor: VendorResponse): VendorFormValues {
  return {
    name: vendor.name,
    city: vendor.city,
    address: vendor.address,
    mapLocation: vendor.mapLocation === null ? '' : coordinatesOf(vendor.mapLocation),
    phoneNumber: vendor.phoneNumber.national,
    whatsAppNumber: vendor.whatsAppNumber?.national ?? '',
    instagramName: vendor.instagramName ?? '',
    openingHours: vendor.openingHours ?? '',
    loginPhoneNumber: vendor.loginPhoneNumber.national,
  };
}

// What the API is sent. Every detail is sent as typed, for the API to read
// and check, and an optional one left empty is sent as null. The form has
// checked that the map location's text is coordinates. An edit sends the
// same, which replaces every detail, so an optional one emptied is cleared.
export function vendorRequestOf(values: VendorFormValues): CreateVendorRequest {
  return {
    name: values.name,
    city: values.city,
    address: values.address,
    mapLocation: mapLocationIn(values.mapLocation) ?? null,
    phoneNumber: values.phoneNumber,
    whatsAppNumber: givenOrNull(values.whatsAppNumber),
    instagramName: givenOrNull(values.instagramName),
    openingHours: givenOrNull(values.openingHours),
    loginPhoneNumber: values.loginPhoneNumber,
  };
}

function givenOrNull(text: string): string | null {
  return text.trim() === '' ? null : text;
}
