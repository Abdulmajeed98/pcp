import type { SubErrorResponse } from '@pcp/api-client';

import type { RefusalBesideAField } from '@/shared/api';

import type { OfferDetailsTyped } from './details-typed';

// The reasons the API gives for refusing each detail of an Offer, as ticket
// 01 of `offers` lists them, and `notANumber` for the IQD price and the
// warranty, which the form itself gives, since the API takes those as
// numbers. Each has a message in the dashboard's text, under
// `OfferForm.refused`, in the three languages.
const reasons = {
  usdPrice: ['missing', 'notANumber', 'notPositive', 'tooManyDecimals', 'tooLarge'],
  iqdPrice: ['notANumber', 'notPositive', 'tooManyDecimals', 'tooLarge'],
  inStock: ['missing'],
  warrantyMonths: ['notANumber', 'notPositive', 'tooLarge', 'notWholeMonths'],
} as const satisfies Record<keyof OfferDetailsTyped, readonly string[]>;

type Detail = keyof typeof reasons;

// A refusal's message, by its key under `OfferForm.refused`: one of a
// detail's reasons, or `other` for a reason the form does not know.
export type OfferDetailRefusal =
  | { [D in Detail]: `${D}.${(typeof reasons)[D][number]}` }[Detail]
  | 'other';

const details = Object.keys(reasons) as Detail[];

// The detail of an Offer a refusal is about, and its message's key, if it
// names one. The API names the first detail that does not fit, in the
// form's order. A refusal of anything else, such as the Part, names no
// detail of the Offer.
export function offerDetailRefusalOf(
  error: SubErrorResponse,
): RefusalBesideAField<OfferDetailsTyped> | undefined {
  const field = error.additionalInformation?.field;
  const detail = details.find((each) => each === field);
  if (detail === undefined) return undefined;

  const reason = error.additionalInformation?.reason;
  const known = (reasons[detail] as readonly string[]).includes(reason ?? '');
  const message: OfferDetailRefusal = known
    ? (`${detail}.${reason}` as OfferDetailRefusal)
    : 'other';
  return { field: detail, message };
}
