import { Refusal } from '@/shared/api';

// The reasons the API gives for refusing an uploaded file as a whole, as
// ticket 02 of `sheet` lists them, in its order (`NOT_VALID`, naming
// `offerSheet`). Each has one sentence in the dashboard's text, under
// `OfferSheetScreen.refused`, in the three languages, which names no limit.
export const fileRefusals = [
  'missing',
  'tooLarge',
  'notReadable',
  'notTheLayout',
  'tooManyRows',
] as const;

export type FileRefusal = (typeof fileRefusals)[number];

// Why the API refused the file itself, when it did: a refusal of another
// kind, or an API that cannot be reached, is not about the file, and the
// screen says it in its refusal panel instead.
export function fileRefusalOf(error: unknown): FileRefusal | undefined {
  if (!(error instanceof Refusal)) return undefined;
  const reason = error.reasonFor('offerSheet');
  return fileRefusals.find((each) => each === reason);
}
