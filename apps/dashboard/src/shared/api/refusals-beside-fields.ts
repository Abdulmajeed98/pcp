import type { SubErrorResponse } from '@pcp/api-client';
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

import { Refusal } from './answer';

// What a form shows beside one of its fields for a refusal of the API that
// names a detail of it: the field, and the message, or its key when the form
// says it in the language it is shown in.
export interface RefusalBesideAField<Values extends FieldValues> {
  field: FieldPath<Values>;
  message: string;
}

// Sets every refusal of the API that names a field of a form beside that
// field, the first taking the focus, as each form of the dashboard shows
// them. It says whether it set any: a refusal that names no field of the
// form, or an API that cannot be reached, is for the form to say above
// itself.
export function setRefusalsBesideTheirFields<Values extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<Values>,
  besideAField: (refused: SubErrorResponse) => RefusalBesideAField<Values> | undefined,
): boolean {
  const onTheForm =
    error instanceof Refusal
      ? error.errors.flatMap((each) => besideAField(each) ?? [])
      : [];
  for (const [index, { field, message }] of onTheForm.entries()) {
    setError(field, { type: 'refused', message }, { shouldFocus: index === 0 });
  }

  return onTheForm.length > 0;
}
