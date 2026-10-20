import type { CreateOfferRequest } from '@pcp/api-client';

import { westernNumberOf } from './western-digits';

// What the Offer form holds while the Vendor fills it in: each price and the
// warranty as typed, and whether the Part is in stock.
export interface OfferFormValues {
  usdPrice: string;
  iqdPrice: string;
  inStock: boolean;
  warrantyMonths: string;
}

// A new Offer's form: nothing typed, and in stock, the usual case, so that it
// takes no tap (OFF-2).
export const newOfferFormValues: OfferFormValues = {
  usdPrice: '',
  iqdPrice: '',
  inStock: true,
  warrantyMonths: '',
};

// A decimal number as the API reads one, in Western digits.
const decimalNumber = /^-?\d+(?:\.\d+)?$/;

// What a field for a number holds, as a number: null when nothing is typed,
// and undefined when what is typed is not a number. The API's own checks
// then say whether it fits, so a fraction of a dinar or a negative price is
// sent as it is, for the API to refuse naming why.
export function numberIn(typed: string): number | null | undefined {
  const western = westernNumberOf(typed);
  if (western === '') return null;
  return decimalNumber.test(western) ? Number(western) : undefined;
}

// What the API is sent for a new Offer of the Part. The USD price is sent as
// the text of its digits, so that its cents arrive as typed, and the API says
// what is wrong with it; the IQD price and the warranty as numbers, which the
// form has checked are numbers. A detail left empty is sent as null, not
// given.
export function offerRequestOf(
  partId: string,
  values: OfferFormValues,
): CreateOfferRequest {
  const usdPrice = westernNumberOf(values.usdPrice);

  return {
    partId,
    usdPrice: usdPrice === '' ? null : usdPrice,
    iqdPrice: numberIn(values.iqdPrice) ?? null,
    inStock: values.inStock,
    warrantyMonths: numberIn(values.warrantyMonths) ?? null,
  };
}
