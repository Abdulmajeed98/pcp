import { Specification, SpecificationProblemReason } from './Specification';

// A Part's specifications, in OpenDB's field names and nesting: for a CPU,
// `{ socket: 'AM5', specifications: { tdp: 65, memory: { types: ['DDR5'] } } }`.
export type SpecificationDocument = Record<string, unknown>;

// A value that was not taken, and why. Its path names the specification, or a
// field of one of its rows.
export type SpecificationProblem = {
  path: string;
  reason: SpecificationProblemReason;
};

// What checking a Part's specifications gives: the ones that fit, as they are
// kept, and what did not fit. Creating a Part refuses any problem. The import
// leaves the values with problems out, and counts them.
export type SpecificationCheck = {
  document: SpecificationDocument;
  problems: SpecificationProblem[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueAt(document: SpecificationDocument, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, name) => (isPlainObject(node) ? node[name] : undefined),
      document,
    );
}

function setAt(document: SpecificationDocument, path: string, value: unknown): void {
  const names = path.split('.');
  const last = names.pop() as string;
  let node = document;
  for (const name of names) {
    if (!isPlainObject(node[name])) node[name] = {};
    node = node[name] as SpecificationDocument;
  }
  node[last] = value;
}

// Every specification a Part of one Category can hold.
export class SpecificationList {
  constructor(private readonly specifications: readonly Specification[]) {}

  getSpecifications(): readonly Specification[] {
    return this.specifications;
  }

  // Checks every value against its specification, in the list's order, and
  // then names each value the list has no specification for.
  check(document: SpecificationDocument): SpecificationCheck {
    const kept: SpecificationDocument = {};
    const problems: SpecificationProblem[] = [];

    for (const specification of this.specifications) {
      const checked = specification.check(valueAt(document, specification.getPath()));
      if (checked.outcome === 'kept') setAt(kept, specification.getPath(), checked.value);
      if (checked.outcome === 'refused') {
        problems.push({ path: checked.path, reason: checked.reason });
      }
    }

    return {
      document: kept,
      problems: [...problems, ...this.unknownIn(document, '')],
    };
  }

  // The needed specifications a Part's specifications do not hold.
  missingNeeded(document: SpecificationDocument): string[] {
    return this.specifications
      .filter((specification) => specification.isNeeded())
      .map((specification) => specification.getPath())
      .filter((path) => valueAt(document, path) === undefined);
  }

  // A value at a place no specification has. An object is looked into only
  // when some specification lies inside it.
  private unknownIn(node: SpecificationDocument, prefix: string): SpecificationProblem[] {
    return Object.entries(node).flatMap(([name, value]) => {
      const path = prefix === '' ? name : `${prefix}.${name}`;
      if (value === null || value === undefined) return [];
      if (this.specifications.some((each) => each.getPath() === path)) return [];
      if (
        isPlainObject(value) &&
        this.specifications.some((each) => each.getPath().startsWith(`${path}.`))
      ) {
        return this.unknownIn(value, path);
      }
      return [{ path, reason: 'unknown' as const }];
    });
  }
}
