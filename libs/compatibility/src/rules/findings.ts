import type { MissingSpecification } from '../outcome';
import type { Reading } from './statement';

// What a rule finds of a condition, such as "the CPU's socket differs from
// the motherboard's": that it holds or that it does not, about the Parts
// whose values decide it, or that it may, when a missing value could decide
// it either way.
export type Finding =
  | { readonly holds: boolean; readonly about: ReadonlySet<string> }
  | { readonly holds: 'maybe'; readonly missing: readonly MissingSpecification[] };

// What a rule finds of a Build: whether it has a Compatibility Problem.
export type Judgment = { readonly problem: Finding };

export function problemWhen(problem: Finding): Judgment {
  return { problem };
}

// A condition decided by values a rule has in hand. The readings they came
// from add their Parts.
export function fact(holds: boolean): Finding {
  return { holds, about: new Set() };
}

// What a rule finds whatever a value is. A value the Part holds decides it,
// and the finding is about that Part too. A missing value is taken to be any
// of the values it could hold, the values of its fixed set, so the condition
// is left open, naming the value, only when some of them would decide it one
// way and some the other.
export function whatever<Value>(
  reading: Reading<Value>,
  values: readonly Value[],
  find: (value: Value) => Finding,
): Finding {
  if (reading.value !== undefined) return alsoAbout(find(reading.value), reading.part);

  const findings = values.map(find);
  for (const holds of [true, false]) {
    if (findings.every((finding) => finding.holds === holds)) {
      return alsoAbout({ holds, about: aboutAll(findings) }, reading.part);
    }
  }
  return {
    holds: 'maybe',
    missing: withoutRepeats([
      { part: reading.part, path: reading.path },
      ...findings.flatMap((finding) => (finding.holds === 'maybe' ? finding.missing : [])),
    ]),
  };
}

// Whether a condition holds of some of several Parts, such as a Build's RAM
// kits. When it does, it is about those it holds of, whatever the others
// lack. When it holds of none but may of some, it is open, naming what they
// lack.
export function some<Item>(items: readonly Item[], find: (item: Item) => Finding): Finding {
  const findings = items.map(find);
  const holding = findings.filter((finding) => finding.holds === true);
  if (holding.length > 0) return { holds: true, about: aboutAll(holding) };

  const open = findings.flatMap((finding) => (finding.holds === 'maybe' ? [finding] : []));
  if (open.length > 0) {
    return {
      holds: 'maybe',
      missing: withoutRepeats(open.flatMap((each) => each.missing)),
    };
  }
  return { holds: false, about: aboutAll(findings) };
}

// Whether either of several conditions holds, such as each of two counts
// against its own limit.
export function either(...findings: readonly Finding[]): Finding {
  return some(findings, (finding) => finding);
}

export function not(finding: Finding): Finding {
  return finding.holds === 'maybe' ? finding : { ...finding, holds: !finding.holds };
}

// Whether a list a Part holds, such as a cooler's sockets, includes a value.
// A missing list could include it or not.
export function includes<Value>(list: Reading<readonly Value[]>, value: Value): Finding {
  if (list.value === undefined) {
    return { holds: 'maybe', missing: [{ part: list.part, path: list.path }] };
  }
  return alsoAbout(fact(list.value.includes(value)), list.part);
}

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

// Whether an amount is more than a limit a Part holds, such as a
// motherboard's memory slots, or than a limit its values make together. It is
// decided when the amount's least is more than the limit's most, or its most
// no more than the limit's least, and is about the Parts counted and the
// limit's. Otherwise it is open, naming the missing values on either side.
export function exceeds(amount: Amount, limit: Reading<number> | Amount): Finding {
  const held = isAmount(limit) ? limit : together(limit);
  const about = new Set([...amount.about, ...held.about]);
  if (amount.least > held.most) return { holds: true, about };
  if (amount.most <= held.least) return { holds: false, about };
  return { holds: 'maybe', missing: withoutRepeats([...amount.missing, ...held.missing]) };
}

function isAmount(limit: Reading<number> | Amount): limit is Amount {
  return 'least' in limit;
}

function alsoAbout(finding: Finding, part: string): Finding {
  if (finding.holds === 'maybe') return finding;
  return { holds: finding.holds, about: new Set([...finding.about, part]) };
}

function aboutAll(findings: readonly Finding[]): Set<string> {
  return new Set(
    findings.flatMap((finding) => (finding.holds === 'maybe' ? [] : [...finding.about])),
  );
}

function withoutRepeats(missing: readonly MissingSpecification[]): MissingSpecification[] {
  return missing.filter(
    (each, index) =>
      missing.findIndex((other) => other.part === each.part && other.path === each.path) ===
      index,
  );
}
