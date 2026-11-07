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
