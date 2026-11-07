import { type MissingSpecification, withoutRepeats } from '../outcome';
import type { Reading } from './reading';

// An amount a rule counts, such as the memory modules of a Build's RAM kits:
// at least `least` and at most `most`, one number when every value in it is
// known. A missing value could be any number, 0 among them, so an amount
// that holds one has no most. It is about the Parts whose known values it
// counts, and names the missing values it holds.
export type Amount = {
  readonly least: number;
  readonly most: number;
  readonly about: ReadonlySet<string>;
  readonly missing: readonly MissingSpecification[];
};

// The product of a Part's values and plain numbers, such as a kit's modules
// times how many of the kit the Build holds. A known 0 makes it 0, whatever
// the rest are. A missing value makes it any number, the Part's own count
// unknown, so the Part is not among those it counts.
export function product(...factors: readonly (Reading<number> | number)[]): Amount {
  const readings = factors.filter((factor) => typeof factor !== 'number');
  const known = factors
    .map((factor) => (typeof factor === 'number' ? factor : factor.value))
    .filter((value) => value !== undefined)
    .reduce((count, value) => count * value, 1);
  const missing = readings
    .filter((reading) => reading.value === undefined)
    .map((reading) => ({ part: reading.part, path: reading.path }));
  const about = new Set(readings.map((reading) => reading.part));

  if (missing.length === 0 || known === 0) {
    return { least: known, most: known, about, missing: [] };
  }
  return { least: 0, most: Infinity, about: new Set(), missing };
}

// A Part a rule counts, such as a drive, as many times as the Build holds it:
// an amount about that Part.
export function counted(part: { readonly id: string; readonly quantity: number }): Amount {
  return {
    least: part.quantity,
    most: part.quantity,
    about: new Set([part.id]),
    missing: [],
  };
}

// The amount of a Part a rule does not count, such as a drive of another kind.
export const nothing: Amount = { least: 0, most: 0, about: new Set(), missing: [] };

// What a rule counts of a Part whatever a value of it is, such as a drive
// counted as a SATA drive by its interface. A value the Part holds decides it.
// A missing value is taken to be any value of its fixed set, so the amount
// runs from the least of theirs to the most, naming the value unless they all
// count the same, and is about the Parts each of them counts.
export function amountWhatever<Value>(
  reading: Reading<Value>,
  values: readonly Value[],
  count: (value: Value) => Amount,
): Amount {
  if (reading.value !== undefined) return count(reading.value);

  const amounts = values.map(count);
  const least = Math.min(...amounts.map((amount) => amount.least));
  const most = Math.max(...amounts.map((amount) => amount.most));
  const counts = new Set(amounts.flatMap((amount) => [...amount.about]));
  const missing = withoutRepeats(amounts.flatMap((amount) => amount.missing));
  const same =
    missing.length === 0 &&
    amounts.every((amount) => amount.least === least && amount.most === most);
  return {
    least,
    most,
    about: new Set(
      [...counts].filter((part) => amounts.every((amount) => amount.about.has(part))),
    ),
    missing: same
      ? []
      : withoutRepeats([{ part: reading.part, path: reading.path }, ...missing]),
  };
}

// The sum of an amount counted for each of several Parts, such as every kit.
export function total<Item>(items: readonly Item[], count: (item: Item) => Amount): Amount {
  const amounts = items.map(count);
  return {
    least: amounts.reduce((sum, amount) => sum + amount.least, 0),
    most: amounts.reduce((sum, amount) => sum + amount.most, 0),
    about: new Set(amounts.flatMap((amount) => [...amount.about])),
    missing: withoutRepeats(amounts.flatMap((amount) => amount.missing)),
  };
}

// A limit that values of one Part make together, such as a motherboard's SATA
// ports of both speeds: their sum, about that Part. A missing value could be
// any number, 0 among them, so a limit that lacks one has no most, and names
// it.
export function together(...values: readonly Reading<number>[]): Amount {
  const least = values.reduce((sum, value) => sum + (value.value ?? 0), 0);
  const missing = values
    .filter((value) => value.value === undefined)
    .map((value) => ({ part: value.part, path: value.path }));
  return {
    least,
    most: missing.length === 0 ? least : Infinity,
    about: new Set(values.map((value) => value.part)),
    missing,
  };
}

// What a rule compares as an amount: an amount counted, a value a Part holds,
// or a plain number.
export type Countable = Amount | Reading<number> | number;

// An amount times a plain number, such as thirteen times a Build's estimated
// power draw.
export function times(countable: Countable, factor: number): Amount {
  const amount = amountOf(countable);
  return { ...amount, least: amount.least * factor, most: amount.most * factor };
}

export function amountOf(countable: Countable): Amount {
  return typeof countable === 'number' || !('least' in countable)
    ? product(countable)
    : countable;
}
