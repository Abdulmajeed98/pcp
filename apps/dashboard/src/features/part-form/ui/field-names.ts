import { get, type FieldErrors } from 'react-hook-form';

import type { PartFormValues } from '../model/form-values';

// An element's `id` for a field of the form, made from its name, which may
// hold dots: `specifications.cores.total` gives `part-specifications-cores-total`.
export function idOf(name: string): string {
  return `part-${name.replaceAll('.', '-')}`;
}

// The error on a field, or on a list as a whole, in words.
export function errorOf(
  errors: FieldErrors<PartFormValues>,
  name: string,
): string | undefined {
  const error = get(errors, name) as
    | { message?: string; root?: { message?: string } }
    | undefined;
  return error?.message ?? error?.root?.message;
}

// The ids a control names in `aria-describedby`: what it says about the
// field, and its error when it has one. Undefined when there are none.
export function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const named = ids.filter((id): id is string => typeof id === 'string');
  return named.length > 0 ? named.join(' ') : undefined;
}
