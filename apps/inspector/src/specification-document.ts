// A Part's specifications, in OpenDB's field names and nesting, as the
// Admin's read of a Part gives them, and a value's place in them by its path,
// `cores.total` naming `cores` and then `total`.
export type SpecificationDocument = Readonly<Record<string, unknown>>;

function isAGroup(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// The value at a path of a Part's specifications, or nothing.
export function valueAt(document: SpecificationDocument, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((held, name) => (isAGroup(held) ? held[name] : undefined), document);
}

// Puts a value at a path of a document, making each group on the way.
export function setAt(document: Record<string, unknown>, path: string, value: unknown) {
  const names = path.split('.');
  const last = names.pop() ?? path;
  let group = document;
  for (const name of names) {
    if (!isAGroup(group[name])) group[name] = {};
    group = group[name] as Record<string, unknown>;
  }
  group[last] = value;
}
