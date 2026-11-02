// The ids a control names in `aria-describedby`: what it says about the
// field, and its error when it has one, each left out where it is `false` or
// undefined. Undefined when there are none, so the attribute is left out.
export function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const named = ids.filter((id): id is string => typeof id === 'string');
  return named.length > 0 ? named.join(' ') : undefined;
}
