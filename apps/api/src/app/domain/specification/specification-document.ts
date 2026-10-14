// A Part's specifications, in OpenDB's field names and nesting: for a CPU,
// `{ socket: 'AM5', specifications: { tdp: 65, memory: { types: ['DDR5'] } } }`.
export type SpecificationDocument = Record<string, unknown>;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// The value at a specification's path, such as `specifications.memory.types`.
export function valueAt(document: SpecificationDocument, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, name) => (isPlainObject(node) ? node[name] : undefined),
      document,
    );
}

export function setAt(document: SpecificationDocument, path: string, value: unknown): void {
  const names = path.split('.');
  const last = names.pop() as string;
  let node = document;
  for (const name of names) {
    if (!isPlainObject(node[name])) node[name] = {};
    node = node[name] as SpecificationDocument;
  }
  node[last] = value;
}
