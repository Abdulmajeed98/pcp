import type { SubErrorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';

import { Refusal } from '@/shared/api';

// What the Admin is told beside a field the API refused, by the reason the
// API gave. The API checks every specification against its Category's list,
// and names the first that does not fit.
const reasons: Record<string, string> = {
  notAWholeNumber: 'Enter a whole number, such as 6.',
  notANumber: 'Enter a number, such as 3.8, with a point before any decimals.',
  negative: 'Enter 0 or more.',
  zeroMeansMissing: '0 cannot be right here. Leave it empty when it is not known.',
  notText: 'Enter text.',
  notYesOrNo: 'Choose Yes, No or Not known.',
  notInTheSet: 'Choose one of the listed values.',
  notAList: 'This has to be a list.',
  notARow: 'Each row has to hold its fields.',
  notAGroup: 'This group of specifications is not valid.',
  unknown: 'This is not a specification of this Category.',
};

// The same for the Part's own fields, which the API checks before its
// specifications, and which the form checks too before it sends them.
export const partFieldMessages: Record<string, string> = {
  name: 'Give the Part a name.',
  manufacturer: 'Give the Part its manufacturer.',
  partNumbers: 'Each part number has to be text.',
};

// The field a refusal is about, as the form names it, if it names one.
export function fieldOf(error: SubErrorResponse): string | undefined {
  return error.additionalInformation?.field;
}

// What the Admin is told about a refusal, in words.
export function messageOf(error: SubErrorResponse): string {
  const reason = error.additionalInformation?.reason;
  if (reason !== undefined && reasons[reason] !== undefined) return reasons[reason];

  const field = fieldOf(error);
  if (field !== undefined && partFieldMessages[field] !== undefined) {
    return partFieldMessages[field];
  }

  return 'The API did not accept this.';
}

// Why the Part was not saved, for a refusal that names no field the form
// shows, or an API that cannot be reached.
export function whyNotSaved(error: unknown): string {
  if (!(error instanceof Refusal)) {
    return 'The API cannot be reached. Check the connection, and save again.';
  }
  return `The API refused the Part, with ${formatNumber(error.status)}, ${error.code}: ${error.errors
    .map(messageOf)
    .join(' ')}`;
}
