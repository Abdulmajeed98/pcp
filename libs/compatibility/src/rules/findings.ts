import type { MissingSpecification } from '../outcome';
import type { Reading } from './statement';

// What a rule finds of a condition, such as "the CPU's socket differs from
// the motherboard's": that it holds or that it does not, about the Parts
// whose values decide it, or that it may, when a missing value could decide
// it either way.
export type Finding =
  | { readonly holds: boolean; readonly about: ReadonlySet<string> }
  | { readonly holds: 'maybe'; readonly missing: readonly MissingSpecification[] };

// What a rule finds of a Build: whether it has a Compatibility Problem, and
// whether it has a Compatibility Warning, which only rules 11, 15 and 20 can
// find. A Problem comes first: the Warning's finding counts only when the
// Problem's does not hold.
export type Judgment = { readonly problem: Finding; readonly warning: Finding };

// A Problem when a condition holds, and otherwise, for a rule that can give
// one, a Warning when another does.
export function problemWhen(
  problem: Finding,
  { warningWhen: warning = fact(false) }: { readonly warningWhen?: Finding } = {},
): Judgment {
  return { problem, warning };
}

// The missing values that leave any of several findings open, such as a
// judgment's Problem and Warning, each named once.
export function missingIn(...findings: readonly Finding[]): MissingSpecification[] {
  return withoutRepeats(
    findings.flatMap((finding) => (finding.holds === 'maybe' ? finding.missing : [])),
  );
}

// A condition decided by values a rule has in hand. The readings they came
// from add their Parts.
export function fact(holds: boolean): Finding {
  return { holds, about: new Set() };
}

// That the Build holds a Part, for a rule that reads none of its values but
// whose Problem is about it, such as the GPU of rule 8.
export function theBuildHolds(part: { readonly id: string }): Finding {
  return { holds: true, about: new Set([part.id]) };
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

export function not(finding: Finding): Finding {
  return finding.holds === 'maybe' ? finding : { ...finding, holds: !finding.holds };
}

// Whether some of several conditions holds, as `some` judges them.
export function or(...findings: readonly Finding[]): Finding {
  return some(findings, (finding) => finding);
}

// Whether every one of several conditions holds, such as a GPU having a
// 12VHPWR socket and its PSU having no such cable. When one does not, it does
// not, about the Parts that decide that one, whatever the others lack.
export function and(...findings: readonly Finding[]): Finding {
  return not(or(...findings.map(not)));
}

// Whether a value a Part holds is the one given, such as a PCIe slot's 16
// lanes. A missing value could be it or not.
export function equals<Value>(reading: Reading<Value>, value: Value): Finding {
  if (reading.value === undefined) {
    return { holds: 'maybe', missing: [{ part: reading.part, path: reading.path }] };
  }
  return alsoAbout(fact(reading.value === value), reading.part);
}

// Whether a condition holds of some row of a list a Part holds, such as a
// motherboard's PCIe slots, each row read at one of its fields. A row's field
// is named by the list's path, the row's place and the field's name, such as
// `pcie_slots.0.lanes`, as the API names it. An empty list holds no row, and
// a missing list could hold any, so it leaves the condition open, naming the
// list.
export function someRow<Row, Field extends keyof Row & string>(
  list: Reading<readonly Row[]>,
  field: Field,
  find: (value: Reading<NonNullable<Row[Field]>>) => Finding,
): Finding {
  if (list.value === undefined) {
    return { holds: 'maybe', missing: [{ part: list.part, path: list.path }] };
  }
  const rows = list.value.map((row, place) => ({
    part: list.part,
    path: `${list.path}.${place}.${field}`,
    value: row[field] ?? undefined,
  }));
  return alsoAbout(some(rows, find), list.part);
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

// What `exceeds` compares: an amount counted, a value a Part holds, or a
// plain number.
type Countable = Amount | Reading<number> | number;

// Whether an amount is more than a limit, such as a Build's RAM modules and a
// motherboard's memory slots, or a GPU's 12VHPWR sockets and none. It is
// decided when the amount's least is more than the limit's most, or its most
// no more than the limit's least, and is about the Parts whose known values
// either side counts. Otherwise it is open, naming the missing values on
// either side.
export function exceeds(amount: Countable, limit: Countable): Finding {
  const counted = amountOf(amount);
  const bound = amountOf(limit);
  const about = new Set([...counted.about, ...bound.about]);
  if (counted.least > bound.most) return { holds: true, about };
  if (counted.most <= bound.least) return { holds: false, about };
  return {
    holds: 'maybe',
    missing: withoutRepeats([...counted.missing, ...bound.missing]),
  };
}

function amountOf(countable: Countable): Amount {
  return typeof countable === 'number' || !('least' in countable)
    ? product(countable)
    : countable;
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
