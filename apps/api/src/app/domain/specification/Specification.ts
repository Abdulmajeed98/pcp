// The kinds of value a specification holds. A list of rows is for a
// specification with several parts of its own, such as a motherboard's PCIe
// slots, and each row's fields have kinds of their own.
export type SpecificationKind =
  | 'wholeNumber'
  | 'decimalNumber'
  | 'text'
  | 'yesNo'
  | 'oneOf'
  | 'severalOf'
  | 'listOfText'
  | 'listOfRows';

// Why a value was not taken.
export type SpecificationProblemReason =
  | 'notAWholeNumber'
  | 'notANumber'
  | 'negative'
  | 'zeroMeansMissing'
  | 'notText'
  | 'notYesOrNo'
  | 'notInTheSet'
  | 'repeated'
  | 'notAList'
  | 'notARow'
  | 'unknown';

// What checking one value gives: the value to keep, nothing because it is
// missing, or the reason it does not fit. A problem may be about a field of a
// row, which `path` then names after the specification's own place.
export type ValueCheck =
  | { outcome: 'kept'; value: unknown }
  | { outcome: 'missing' }
  | { outcome: 'refused'; path: string; reason: SpecificationProblemReason };

type Options = {
  unit?: string;
  needed?: boolean;
  zeroMeansMissing?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

  static wholeNumber(path: string, label: string, options: Options = {}): Specification {
    return Specification.of(path, label, 'wholeNumber', options);
  }

  static decimalNumber(path: string, label: string, options: Options = {}): Specification {
    return Specification.of(path, label, 'decimalNumber', options);
  }

  static text(path: string, label: string, options: Options = {}): Specification {
    return Specification.of(path, label, 'text', options);
  }

  static yesNo(path: string, label: string, options: Options = {}): Specification {
    return Specification.of(path, label, 'yesNo', options);
  }

  // A value from a fixed set. A specification that a Compatibility Rule
  // compares for equality, such as a socket, is one, so that two spellings of
  // the same value cannot cause a false Compatibility Problem.
  static oneOf(
    path: string,
    label: string,
    values: readonly string[],
    options: Options = {},
  ): Specification {
    return Specification.of(path, label, 'oneOf', options, values);
  }

  static severalOf(
    path: string,
    label: string,
    values: readonly string[],
    options: Options = {},
  ): Specification {
    return Specification.of(path, label, 'severalOf', options, values);
  }

  static listOfText(path: string, label: string, options: Options = {}): Specification {
    return Specification.of(path, label, 'listOfText', options);
  }

  // Each row is an object whose fields are the given specifications, named by
  // their paths. A row's field may be missing.
  static listOfRows(
    path: string,
    label: string,
    fields: readonly Specification[],
    options: Options = {},
  ): Specification {
    return Specification.of(path, label, 'listOfRows', options, undefined, fields);
  }

  private static of(
    path: string,
    label: string,
    kind: SpecificationKind,
    options: Options,
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
  doesZeroMeanMissing(): boolean {
    return this.zeroMeansMissing;
  }

  // Checks one value against this specification. Null, an empty text and an
  // empty choice of several are missing, not refused.
  check(value: unknown): ValueCheck {
    if (value === null || value === undefined || value === '')
      return { outcome: 'missing' };

    switch (this.kind) {
      case 'wholeNumber':
      case 'decimalNumber':
        return this.checkNumber(value);
      case 'text':
        return typeof value === 'string' ? this.kept(value) : this.refused('notText');
      case 'yesNo':
        return typeof value === 'boolean' ? this.kept(value) : this.refused('notYesOrNo');
      case 'oneOf':
        return typeof value === 'string' && this.values?.includes(value)
          ? this.kept(value)
          : this.refused('notInTheSet');
      case 'severalOf':
        return this.checkSeveral(value);
      case 'listOfText':
        return this.checkListOfText(value);
      case 'listOfRows':
        return this.checkRows(value);
    }
  }

  private kept(value: unknown): ValueCheck {
    return { outcome: 'kept', value };
  }

  private refused(reason: SpecificationProblemReason, path = this.path): ValueCheck {
    return { outcome: 'refused', path, reason };
  }

  private checkNumber(value: unknown): ValueCheck {
    if (typeof value !== 'number' || !Number.isFinite(value))
      return this.refused('notANumber');
    if (this.kind === 'wholeNumber' && !Number.isInteger(value)) {
      return this.refused('notAWholeNumber');
    }
    if (value < 0) return this.refused('negative');
    if (value === 0 && this.zeroMeansMissing) return this.refused('zeroMeansMissing');
    return this.kept(value);
  }

  private checkSeveral(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');
    if (value.length === 0) return { outcome: 'missing' };
    if (!value.every((each) => typeof each === 'string' && this.values?.includes(each))) {
      return this.refused('notInTheSet');
    }
    if (new Set(value).size !== value.length) return this.refused('repeated');
    return this.kept(value);
  }

  private checkListOfText(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');
    if (value.length === 0) return { outcome: 'missing' };
    if (!value.every((each) => typeof each === 'string' && each !== '')) {
      return this.refused('notText');
    }
    return this.kept(value);
  }

  // An empty list of rows is a value: a motherboard with no M.2 slot has none.
  private checkRows(value: unknown): ValueCheck {
    if (!Array.isArray(value)) return this.refused('notAList');

    const rows: Record<string, unknown>[] = [];
    for (const [index, row] of value.entries()) {
      if (!isPlainObject(row)) return this.refused('notARow', `${this.path}.${index}`);

      const kept: Record<string, unknown> = {};
      for (const [name, fieldValue] of Object.entries(row)) {
        const field = this.fields?.find((each) => each.getPath() === name);
        if (field === undefined)
          return this.refused('unknown', `${this.path}.${index}.${name}`);

        const checked = field.check(fieldValue);
        if (checked.outcome === 'refused') {
          return this.refused(checked.reason, `${this.path}.${index}.${name}`);
        }
        if (checked.outcome === 'kept') kept[name] = checked.value;
      }
      rows.push(kept);
    }
    return this.kept(rows);
  }
}
