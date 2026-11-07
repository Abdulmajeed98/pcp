import type { Build, Category, Part } from '../build';
import type { Judgment } from './findings';
import type { Reading } from './reading';

// A Compatibility Rule, stated once: its number, the Categories it involves
// with the specifications it reads in each, by their paths, those it reads in
// a Category it does not involve when the Build holds a Part of it, and its
// judgment. It applies to a Build that holds a Part of each Category it
// involves (CMP-2).
export type Rule = {
  readonly number: number;
  readonly involves: Involves;
  readonly readsWhenHeld: Involves;
  judge(build: Build): Judgment;
};

// States a rule. Its judgment is handed the Parts of the Categories it
// involves, and reads each one's values through the paths stated for its
// Category, and no others: what a rule reads is what it states. It is handed
// a Part of a Category it reads when held, such as rule 12's GPU, when the
// Build holds one, and nothing otherwise.
export function rule<
  const Stated extends Involves,
  const WhenHeld extends Involves = {},
>(statement: {
  readonly number: number;
  readonly involves: Stated;
  readonly readsWhenHeld?: WhenHeld;
  readonly judge: (parts: PartsRead<Stated> & PartsReadWhenHeld<WhenHeld>) => Judgment;
}): Rule {
  const { number, involves, readsWhenHeld = {} as WhenHeld, judge } = statement;
  return {
    number,
    involves,
    readsWhenHeld,
    judge: (build) =>
      judge(
        partsRead(build, [
          ...Object.keys(involves),
          ...Object.keys(readsWhenHeld),
        ]) as PartsRead<Stated> & PartsReadWhenHeld<WhenHeld>,
      ),
  };
}

type Involves = {
  readonly [C in Category]?: readonly PathOf<SpecificationsOf<C>>[];
};

type SpecificationsOf<C extends Category> =
  NonNullable<Build[C]> extends readonly (infer Held)[]
    ? Held extends Part<infer Specifications>
      ? Specifications
      : never
    : NonNullable<Build[C]> extends Part<infer Specifications>
      ? Specifications
      : never;

// A specification's path, such as `specifications.memory.types`: the names
// that lead to it in a Part's specifications, joined by dots. A list, such as
// a motherboard's PCIe slots, is one specification.
type PathOf<Specifications> = {
  [Name in keyof Specifications & string]-?: NonNullable<Specifications[Name]> extends
    | string
    | number
    | boolean
    | readonly unknown[]
    ? Name
    : `${Name}.${PathOf<NonNullable<Specifications[Name]>>}`;
}[keyof Specifications & string];

type ValueAt<Specifications, Path extends string> = Path extends keyof Specifications
  ? NonNullable<Specifications[Path]>
  : Path extends `${infer Name}.${infer Rest}`
    ? Name extends keyof Specifications
      ? ValueAt<NonNullable<Specifications[Name]>, Rest>
      : never
    : never;

// A Part as a judgment reads it: its identifier, and its value at each path
// stated for its Category.
export type PartRead<Specifications, Path extends string> = {
  readonly id: string;
  read<P extends Path>(path: P): Reading<ValueAt<Specifications, P>>;
};

// A Part read outside a rule, at any of its paths, for what the library
// answers beside the rules from the same values: a Build's estimated power
// draw, which rule 12 compares with a PSU's wattage.
export function readPart<Specifications>(
  part: Part<Specifications>,
): PartRead<Specifications, PathOf<Specifications>> {
  return partRead(part) as PartRead<Specifications, PathOf<Specifications>>;
}

type PathIn<Paths> = Paths extends readonly (infer Path extends string)[] ? Path : never;

// The Parts a judgment is handed: one of each Category the rule involves,
// and every RAM kit or drive, with its quantity.
type PartsRead<Stated extends Involves> = {
  readonly [C in keyof Stated & Category]: NonNullable<Build[C]> extends readonly unknown[]
    ? readonly (PartRead<SpecificationsOf<C>, PathIn<Stated[C]>> & {
        readonly quantity: number;
      })[]
    : PartRead<SpecificationsOf<C>, PathIn<Stated[C]>>;
};

// The Parts a judgment is handed of the Categories a rule reads when held:
// each one's Part when the Build holds one, and none otherwise.
type PartsReadWhenHeld<Stated extends Involves> = {
  readonly [C in keyof Stated & Category]: PartsRead<Stated>[C] | undefined;
};

type HeldPart = Part<unknown> & { readonly quantity?: number };

function partsRead(build: Build, categories: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(
    categories.map((category) => {
      const held = build[category as Category] as
        | HeldPart
        | readonly HeldPart[]
        | undefined;
      if (held === undefined) return [category, undefined];
      return [
        category,
        Array.isArray(held) ? held.map(partRead) : partRead(held as HeldPart),
      ];
    }),
  );
}

function partRead(part: HeldPart): unknown {
  return {
    id: part.id,
    quantity: part.quantity,
    read: (path: string): Reading<unknown> => ({
      part: part.id,
      path,
      value: valueAt(part.specifications, path),
    }),
  };
}

function valueAt(specifications: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (held, name) => (isGroup(held) ? held[name] : undefined),
      specifications,
    );
}

function isGroup(held: unknown): held is Record<string, unknown> {
  return typeof held === 'object' && held !== null && !Array.isArray(held);
}
