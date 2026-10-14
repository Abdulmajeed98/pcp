import { isPlainObject } from './specification-document';

const kinds = [
  'wholeNumber',
  'decimalNumber',
  'text',
  'yesNo',
  'oneOf',
  'severalOf',
  'listOfText',
  'listOfRows',
] as const;

// The kinds of value a specification holds. A list of rows is for a
// specification with several parts of its own, such as a motherboard's PCIe
// slots, and each row's fields have kinds of their own.
export type SpecificationKind = (typeof kinds)[number];

// Why a value was not taken.
export type SpecificationProblemReason =
  | 'notAWholeNumber'
  | 'notANumber'
  | 'negative'
  | 'zeroMeansMissing'
  | 'notText'
  | 'notYesOrNo'
  | 'notInTheSet'
  | 'notAList'
  | 'notARow'
  | 'unknown';

// A value that was not taken, and why. Its path is the specification's, or,
// for a field of a row, the specification's followed by the row's place and
// the field's name: `pcie_slots.0.lanes`.
export type SpecificationProblem = {
  path: string;
  reason: SpecificationProblemReason;
};

// What checking one value gives: the value to keep, if any, and the problems
// found in it. A missing value gives neither. A list of rows keeps its rows
// and the fields in them that fit, and names each one that does not.
export type ValueCheck = {
  value?: unknown;
  problems: SpecificationProblem[];
};

export type SpecificationOptions = {
  unit?: string;
  needed?: boolean;
  zeroMeansMissing?: boolean;
};

// One named property of a Part, defined for its Category, such as a CPU's
// socket. Its path is its place in a Part's specifications, in OpenDB's field
// names and nesting: `socket`, or `specifications.memory.types`. A needed
// specification is one that a Compatibility Rule reads.
export class Specification {
  private constructor(
    private readonly path: string,
    private readonly label: string,
    private readonly kind: SpecificationKind,
    private readonly unit: string | undefined,
    private readonly values: readonly string[] | undefined,
    private readonly fields: readonly Specification[] | undefined,
    private readonly needed: boolean,
    private readonly zeroMeansMissing: boolean,
  ) {}

  static wholeNumber(
    path: string,
    label: string,
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'wholeNumber', options);
  }

  static decimalNumber(
    path: string,
    label: string,
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'decimalNumber', options);
  }

  static text(
    path: string,
    label: string,
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'text', options);
  }

  static yesNo(
    path: string,
    label: string,
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'yesNo', options);
  }

  // A value from a fixed set. A specification that a Compatibility Rule
  // compares for equality, such as a socket, is one, so that two spellings of
  // the same value cannot cause a false Compatibility Problem.
  static oneOf(
    path: string,
    label: string,
    values: readonly string[],
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'oneOf', options, values);
  }

  static severalOf(
    path: string,
    label: string,
    values: readonly string[],
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'severalOf', options, values);
  }

  static listOfText(
    path: string,
    label: string,
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'listOfText', options);
  }

  // Each row is an object whose fields are the given specifications, named by
  // their paths. A row's field may be missing.
  static listOfRows(
    path: string,
    label: string,
    fields: readonly Specification[],
    options: SpecificationOptions = {},
  ): Specification {
    return Specification.of(path, label, 'listOfRows', options, undefined, fields);
  }

  private static of(
    path: string,
    label: string,
    kind: SpecificationKind,
    options: SpecificationOptions,
    values?: readonly string[],
    fields?: readonly Specification[],
  ): Specification {
    return new Specification(
      path,
      label,
      kind,
      options.unit,
      values,
      fields,
      options.needed ?? false,
      options.zeroMeansMissing ?? false,
    );
  }

  static kinds(): readonly SpecificationKind[] {
    return kinds;
  }

  getPath(): string {
    return this.path;
  }

  getLabel(): string {
    return this.label;
  }

  getKind(): SpecificationKind {
    return this.kind;
  }

  getUnit(): string | undefined {
    return this.unit;
  }

  // The fixed set, for one or several of a fixed set.
  getValues(): readonly string[] | undefined {
    return this.values;
  }

  // The fields of each row, for a list of rows.
  getFields(): readonly Specification[] | undefined {
    return this.fields;
  }

  isNeeded(): boolean {
    return this.needed;
  }

  // Whether 0 stands for "not known" rather than for nothing, because 0 cannot
  // be true for this specification, as for a length or a clock speed.
  isZeroMissing(): boolean {
    return this.zeroMeansMissing;
  }

  // Checks one value against this specification. Null, an empty text and an
  // empty choice of several are missing, not refused.
  check(value: unknown): ValueCheck {
    if (value === null || value === undefined || value === '') return missing;

    switch (this.kind) {
      case 'wholeNumber':
      case 'decimalNumber':
        return this.checkNumber(value);
      case 'text':
        return typeof value === 'string' ? kept(value) : this.refused('notText');
      case 'yesNo':
        return typeof value === 'boolean' ? kept(value) : this.refused('notYesOrNo');
      case 'oneOf':
        return typeof value === 'string' && this.values?.includes(value)
          ? kept(value)
          : this.refused('notInTheSet');
      case 'severalOf':
        return this.checkSeveral(value);
      case 'listOfText':
        return this.checkListOfText(value);
      case 'listOfRows':
        return this.checkRows(value);
    }
  }

  private refused(reason: SpecificationProblemReason): ValueCheck {
    return { problems: [{ path: this.path, reason }] };
  }

  private checkNumber(value: unknown): ValueCheck {
    if (typeof value !== 'number' || !Number.isFinite(value))
      return this.refused('notANumber');
    if (this.kind === 'wholeNumber' && !Number.isInteger(value)) {
      return this.refused('notAWholeNumber');
    }
    if (value < 0) return this.refused('negative');
    if (value === 0 && this.zeroMeansMissing) return this.refused('zeroMeansMissing');
    return kept(value);
  }

  // A value given twice is kept once. Each value outside the set is named,
  // and the others are kept, so that one socket the set does not hold does
  // not cost a cooler all the sockets it does. Creating a Part still refuses
  // it.
  private checkSeveral(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');

    const inTheSet = (each: unknown): each is string =>
      typeof each === 'string' && (this.values?.includes(each) ?? false);
    const problems = value
      .filter((each) => !inTheSet(each))
      .map(() => ({ path: this.path, reason: 'notInTheSet' as const }));
    const known = [...new Set(value.filter(inTheSet))];
    return known.length === 0 ? { problems } : { value: known, problems };
  }

  private checkListOfText(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');
    if (value.length === 0) return missing;
    if (!value.every((each) => typeof each === 'string' && each !== '')) {
      return this.refused('notText');
    }
    return kept(value);
  }

  // An empty list of rows is a value: a motherboard with no M.2 slot has none.
  // A row that is not an object is left out, and so is a field of a row that
  // does not fit, so that one bad field does not cost the other rows.
  private checkRows(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');

    const rows: Record<string, unknown>[] = [];
    const problems: SpecificationProblem[] = [];
    for (const [index, row] of value.entries()) {
      const rowPath = `${this.path}.${index}`;
      if (!isPlainObject(row)) {
        problems.push({ path: rowPath, reason: 'notARow' });
        continue;
      }

      const keptFields: Record<string, unknown> = {};
      for (const [name, fieldValue] of Object.entries(row)) {
        const field = this.fields?.find((each) => each.getPath() === name);
        if (field === undefined) {
          problems.push({ path: `${rowPath}.${name}`, reason: 'unknown' });
          continue;
        }
        const checked = field.check(fieldValue);
        problems.push(
          ...checked.problems.map((problem) => ({
            ...problem,
            path: `${rowPath}.${name}`,
          })),
        );
        if (checked.value !== undefined) keptFields[name] = checked.value;
      }
      rows.push(keptFields);
    }
    return { value: rows, problems };
  }
}

const missing: ValueCheck = { problems: [] };

function kept(value: unknown): ValueCheck {
  return { value, problems: [] };
}
