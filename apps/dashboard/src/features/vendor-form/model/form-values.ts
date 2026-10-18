import type { CreateVendorRequest } from '@pcp/api-client';

import { type CityKey, mapLocationIn } from '@/entities/vendor';

// The longest a detail written as text may be, in characters, as the API
// checks it. The API's description states the name's, the address's and the
// opening hours'. An Instagram name's is Instagram's own, and is counted once
// an @ or a profile's address is taken off it.
export const longest = {
  name: 100,
  address: 300,
  openingHours: 300,
  instagramName: 30,
} as const;

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

// What the API is sent. Every detail is sent as typed, for the API to read
// and check, and an optional one left empty is sent as null. The form has
// checked that the map location's text is coordinates.
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
