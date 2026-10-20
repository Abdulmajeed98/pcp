import type { EditOfferRequest, OfferResponse } from '@pcp/api-client';

import { iqdAmountWritten, usdAmountWritten } from '@/entities/offer';

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

// The form of an Offer that is changed: its details as they are, each price
// written as the portal shows it, in Western digits grouped in thousands,
// which the form takes back as typed, and a detail it does not state left
// empty.
export function formValuesOf(offer: OfferResponse): OfferFormValues {
  return {
    usdPrice: offer.usdPrice === null ? '' : usdAmountWritten(offer.usdPrice),
    iqdPrice: offer.iqdPrice === null ? '' : iqdAmountWritten(offer.iqdPrice),
    inStock: offer.inStock,
    warrantyMonths: offer.warrantyMonths === null ? '' : String(offer.warrantyMonths),
  };
}

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

// The Offer's details as the API is sent them, for a new Offer and for a
// change to one alike. The USD price is sent as the text of its digits, so
// that its cents arrive as typed, and the API says what is wrong with it; the
// IQD price and the warranty as numbers, which the form has checked are
// numbers. A detail left empty is sent as null, not given, which a change
// takes as cleared.
export function offerDetailsOf(values: OfferFormValues): EditOfferRequest {
  const usdPrice = westernNumberOf(values.usdPrice);

  return {
    usdPrice: usdPrice === '' ? null : usdPrice,
    iqdPrice: numberIn(values.iqdPrice) ?? null,
    inStock: values.inStock,
    warrantyMonths: numberIn(values.warrantyMonths) ?? null,
  };
}
