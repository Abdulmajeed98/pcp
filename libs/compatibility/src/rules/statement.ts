import type { Build, Category, Part } from '../build';
import type { Judgment } from './findings';

// A Compatibility Rule, stated once: its number, the Categories it involves
// with the specifications it reads in each, by their paths, and its judgment.
// It applies to a Build that holds a Part of each Category it involves
// (CMP-2).
export type Rule = {
  readonly number: number;
  readonly involves: Involves;
  judge(build: Build): Judgment;
};

// States a rule. Its judgment is handed the Parts of the Categories it
// involves, and reads each one's values through the paths stated for its
// Category, and no others: what a rule reads is what it states.
export function rule<const Stated extends Involves>(statement: {
  readonly number: number;
  readonly involves: Stated;
  readonly judge: (parts: PartsRead<Stated>) => Judgment;
}): Rule {
  const { number, involves, judge } = statement;
  return {
    number,
    involves,
    judge: (build) => judge(partsRead(build, involves) as PartsRead<Stated>),
  };
}

// One value a rule reads: a Part's value at a specification's path, or none
// when the Part was not given it, which makes it missing.
export type Reading<Value> = {
  readonly part: string;
  readonly path: string;
  readonly value: Value | undefined;
};

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

type PartRead<Specifications, Path extends string> = {
  readonly id: string;
  read<P extends Path>(path: P): Reading<ValueAt<Specifications, P>>;
};

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

type HeldPart = Part<unknown> & { readonly quantity?: number };

function partsRead(build: Build, involves: Involves): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(involves).map((category) => {
      const held = build[category as Category] as HeldPart | readonly HeldPart[];
      return [
        category,
        Array.isArray(held) ? held.map(partRead) : partRead(held as HeldPart),
      ];
    }),
  );
}

function partRead(part: HeldPart) {
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
