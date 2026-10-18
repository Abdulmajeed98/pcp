import type { SubErrorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';

import { longest } from '@/entities/vendor';
import { Refusal } from '@/shared/api';

import { type VendorFormValues } from './form-values';

// What the Admin is told beside a required detail left empty. The form says
// it before it sends anything, and the API says the same when it refuses a
// missing detail.
export const missingDetailMessages = {
  name: 'Give the Vendor its name.',
  address: 'Give the Vendor’s address.',
  phoneNumber: 'Give the Vendor’s phone number.',
  loginPhoneNumber: 'Give the phone number the Vendor will log in with.',
} as const;

// What the Admin is told beside a detail the API refused, by the detail and
// the reason the API gave: every reason ticket 02 of `accounts` lists. The
// API names the first detail that does not fit.
const reasons: Record<string, string> = {
  'name:missing': missingDetailMessages.name,
  'name:tooLong': `The name is over ${formatNumber(longest.name)} characters.`,
  'city:missing': 'Choose the Vendor’s city.',
  'city:notInTheSet': 'Choose one of the listed cities.',
  'address:missing': missingDetailMessages.address,
  'address:tooLong': `The address is over ${formatNumber(longest.address)} characters.`,
  'mapLocation:missing': 'Give both the latitude and the longitude, or neither.',
  'mapLocation:outsideIraq':
    'This place is outside Iraq. Check that the latitude comes first, before the longitude.',
  'phoneNumber:missing': missingDetailMessages.phoneNumber,
  'phoneNumber:notIraqi': 'This is not an Iraqi phone number. Check its digits.',
  'whatsAppNumber:notIraqi': 'This is not an Iraqi phone number. Check its digits.',
  'whatsAppNumber:notMobile': 'This is a landline. WhatsApp needs a mobile number.',
  'instagramName:notAnInstagramName':
    'An Instagram name holds only the letters a to z, digits, dots and underscores.',
  'instagramName:tooLong': `An Instagram name is at most ${formatNumber(longest.instagramName)} characters.`,
  'openingHours:tooLong': `The opening hours are over ${formatNumber(longest.openingHours)} characters.`,
  'loginPhoneNumber:missing': missingDetailMessages.loginPhoneNumber,
  'loginPhoneNumber:notIraqi': 'This is not an Iraqi phone number. Check its digits.',
  'loginPhoneNumber:notMobile':
    'This is a landline. A Vendor logs in with a mobile number, which WhatsApp reaches.',
  'loginPhoneNumber:taken': 'Another Vendor already logs in with this number.',
};

// The details the form shows, by the name the API gives each.
const details: readonly (keyof VendorFormValues)[] = [
  'name',
  'city',
  'address',
  'mapLocation',
  'phoneNumber',
  'whatsAppNumber',
  'instagramName',
  'openingHours',
  'loginPhoneNumber',
];

// The detail of the form a refusal is about, if it names one. A refused
// latitude or longitude is about the map location, which the form shows as
// one field.
export function detailOf(error: SubErrorResponse): keyof VendorFormValues | undefined {
  const field = error.additionalInformation?.field?.split('.')[0];
  return details.find((detail) => detail === field);
}

// What the Admin is told about a refusal of a detail, in words.
export function messageOf(error: SubErrorResponse): string {
  const message = reasons[`${detailOf(error)}:${error.additionalInformation?.reason}`];
  return message ?? 'The API did not accept this.';
}

// Why the Vendor was not created, or not saved by the Admin's edit, for a
// refusal that names no detail of the form, Keycloak that cannot be reached,
// or an API that cannot be.
export function whyNotSaved(error: unknown, editing: boolean): string {
  if (!(error instanceof Refusal)) {
    return editing
      ? 'The API cannot be reached. Check the connection, and save the Vendor again.'
      : 'The API cannot be reached. Check the connection, and create the Vendor again.';
  }
  if (error.code === 'IDENTITY_SERVICE_UNAVAILABLE') {
    return editing
      ? 'The login service cannot be reached, so neither the Vendor nor its Login was changed. Save the Vendor again in a moment.'
      : 'The login service cannot be reached, so neither the Vendor nor its Login was made. Create the Vendor again in a moment.';
  }
  return `The API refused the Vendor, with ${formatNumber(error.status)}, ${error.code}.`;
}
