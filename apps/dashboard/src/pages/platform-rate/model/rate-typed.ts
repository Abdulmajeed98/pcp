import type { SubErrorResponse } from '@pcp/api-client';

import { westernDigitsIn } from '@/shared/lib';

// A rate as the Admin's keyboard writes it, as the API reads it, as the
// Offer form takes a price: Arabic-Indic and Eastern Arabic-Indic digits
// become Western ones, and thousands separators (a comma, the Arabic
// thousands separator ٬ and the Arabic comma ،) and spaces of any width are
// dropped.
const grouping = /[,٬،\s]/gu;

// A number as the API reads one, in Western digits.
const aNumber = /^-?\d+(?:\.\d+)?$/;

// What the field holds, as a number: null when nothing is typed, and
// undefined when what is typed is not a number. Anything that is a number is
// sent as it is, a fraction or a rate out of range too, for the API to judge:
// no frontend holds the limits.
export function rateIn(typed: string): number | null | undefined {
  const western = westernDigitsIn(typed).replace(grouping, '');
  if (western === '') return null;
  return aNumber.test(western) ? Number(western) : undefined;
}

// What the form holds while the Admin types.
export interface RateFormValues {
  iqdPerUsd: string;
}

// The Admin is told, beside the field, why a rate was not taken: by the
// form itself when nothing is typed or what is typed is not a number, and
// by the API's reason otherwise. A limit is not named, so no copy of the
// limits is kept here.
const messages: Record<string, string> = {
  missing: 'Enter the rate, such as 1,575.',
  notANumber: 'Enter a number, such as 1,575.',
  notWhole: 'Enter a whole number of dinars, such as 1,575.',
  outOfRange: 'The rate is outside the allowed range.',
};

export function rateMessage(reason: 'missing' | 'notANumber'): string {
  return messages[reason];
}

// The field's message for a refusal of the API, if it names the rate.
export function refusalOfTheRate(
  error: SubErrorResponse,
): { field: 'iqdPerUsd'; message: string } | undefined {
  if (error.additionalInformation?.field !== 'iqdPerUsd') return undefined;
  const reason = error.additionalInformation.reason ?? '';
  return {
    field: 'iqdPerUsd',
    message: messages[reason] ?? 'The API did not accept this rate.',
  };
}
