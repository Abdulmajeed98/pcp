// A Part's specifications, as one document in OpenDB's field names and
// nesting: `{ cores: { total: 6 }, socket: 'AM5' }`. A specification's path
// names its place in it: `cores.total`.
export type SpecificationDocument = Record<string, unknown>;

// The value at a path, or undefined when the document holds none there.
export function valueAt(document: SpecificationDocument, path: string): unknown {
  let node: unknown = document;
  for (const name of path.split('.')) {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[name];
  }
  return node;
}

// Puts a value at a path, making the objects on the way.
export function setAt(document: SpecificationDocument, path: string, value: unknown): void {
  const names = path.split('.');
  const last = names.pop() as string;
  let node = document;
  for (const name of names) {
    const next = node[name];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) node[name] = {};
    node = node[name] as SpecificationDocument;
  }
  node[last] = value;
}
