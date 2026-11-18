import type { SubErrorResponse } from '@pcp/api-client';

import { offerDetailRefusalOf } from '@/entities/offer';
import type { RefusalBesideAField } from '@/shared/api';

import type { PartRequestFormValues } from './form-values';

// The reasons the API gives for refusing each detail of the Part a request
// names, as ticket 01 of `part-requests` lists them. Each has a message in
// the dashboard's text, under `PartRequestForm.refused`, in the three
// languages. The Offer's details are refused as an Offer's are, and said as
// the Offer form says them.
const reasons = {
  category: ['missing', 'notInTheSet'],
  name: ['missing', 'tooLong'],
  partNumber: ['missing', 'tooLong'],
} as const;

type Detail = keyof typeof reasons;

// A refusal's message, by its key under `PartRequestForm.refused`: one of a
// detail's reasons, or `other` for a reason the form does not know.
export type PartRefusal =
  | { [D in Detail]: `${D}.${(typeof reasons)[D][number]}` }[Detail]
  | 'other';

const details = Object.keys(reasons) as Detail[];

// The field of the form a refusal is about, and its message's key, if it
// names one. The API names the first detail that does not fit, in the form's
// order: the Part's three, then the Offer's.
export function refusalOf(
  error: SubErrorResponse,
): RefusalBesideAField<PartRequestFormValues> | undefined {
  const field = error.additionalInformation?.field;
  const detail = details.find((each) => each === field);
  if (detail === undefined) return offerDetailRefusalOf(error);

  const reason = error.additionalInformation?.reason;
  const known = (reasons[detail] as readonly string[]).includes(reason ?? '');
  const message: PartRefusal = known ? (`${detail}.${reason}` as PartRefusal) : 'other';
  return { field: detail, message };
}
