import type { SubErrorResponse } from '@pcp/api-client';

import type { ContactDetailsFormValues } from './form-values';

// The reasons the API gives for refusing each contact detail, as ticket 02
// of `accounts` lists them. Each has a message in the dashboard's text, under
// `ContactDetailsForm.refused`, in the three languages.
const reasons = {
  address: ['missing', 'tooLong'],
  mapLocation: ['missing', 'outsideIraq'],
  phoneNumber: ['missing', 'notIraqi'],
  whatsAppNumber: ['notIraqi', 'notMobile'],
  instagramName: ['notAnInstagramName', 'tooLong'],
  openingHours: ['tooLong'],
} as const satisfies Record<keyof ContactDetailsFormValues, readonly string[]>;

type Detail = keyof typeof reasons;

// A refusal's message, by its key under `ContactDetailsForm.refused`: one of
// a detail's reasons, or `other` for a reason the form does not know.
export type RefusalMessage =
  | { [D in Detail]: `${D}.${(typeof reasons)[D][number]}` }[Detail]
  | 'other';

const details = Object.keys(reasons) as Detail[];

// The detail of the form a refusal is about, and its message, if it names a
// detail. A refused latitude or longitude is about the map location, which
// the form shows as one field. The API names the first detail that does not
// fit.
export function refusalOf(
  error: SubErrorResponse,
): { detail: Detail; message: RefusalMessage } | undefined {
  const field = error.additionalInformation?.field?.split('.')[0];
  const detail = details.find((each) => each === field);
  if (detail === undefined) return undefined;

  const reason = error.additionalInformation?.reason;
  const known = (reasons[detail] as readonly string[]).includes(reason ?? '');
  return {
    detail,
    message: known ? (`${detail}.${reason}` as RefusalMessage) : 'other',
  };
}
