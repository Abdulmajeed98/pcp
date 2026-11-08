import {
  judgeBuild,
  type MissingSpecification,
  type RuleOutcome,
} from '@pcp/compatibility';

import { specificationListOf } from '../specification/specification-lists';
import { Build } from './Build';
import { buildForTheRules } from './parts-for-the-rules';

// A needed specification that a Part of a Build lacks, as a Compatibility
// Rule names it, with its English labels from the Part's Specification list,
// so that a Shopper reads it in English in every language (LANG-3).
export class MissingInABuild {
  constructor(
    private readonly partId: string,
    private readonly path: string,
    private readonly label: string,
    private readonly fieldLabel: string | undefined,
  ) {}

  getPartId(): string {
    return this.partId;
  }

  // Its path, as the rules name it: for a field of a row, the list's path,
  // the row's place and the field's name, such as `pcie_slots.0.lanes`.
  getPath(): string {
    return this.path;
  }

  // Its label: for a field of a row, the list's.
  getLabel(): string {
    return this.label;
  }

  // For a field of a row, the field's label; none otherwise.
  getFieldLabel(): string | undefined {
    return this.fieldLabel;
  }
}

// The outcome of one Compatibility Rule that applies to a Build, as the
// rules answer it, each missing specification of an unchecked rule
// labelled.
export type Outcome =
  | Exclude<RuleOutcome, { outcome: 'unchecked' }>
  | {
      readonly rule: number;
      readonly outcome: 'unchecked';
      readonly missing: readonly MissingInABuild[];
    };

// What the Compatibility Rules find in a Build.
export class Judgment {
  constructor(private readonly outcomes: readonly Outcome[]) {}

  // The outcome of every rule that applies to the Build, passes included, in
  // rule order.
  getOutcomes(): readonly Outcome[] {
    return this.outcomes;
  }
}

// What the rules find in a Build, every Part of it judged, a Part that is no
// longer a Visible Part and one no Vendor has in stock among them, since each
// stays in the Build until the Shopper removes it.
export function judgmentOf(build: Build): Judgment {
  const labelled = labelledIn(build);
  return new Judgment(
    judgeBuild(buildForTheRules(build)).map((outcome) =>
      outcome.outcome === 'unchecked'
        ? { ...outcome, missing: outcome.missing.map(labelled) }
        : outcome,
    ),
  );
}

// A missing specification of a Part of the Build, labelled from its Part's
// Specification list. The rules name only paths the lists hold, which the
// Categories endpoint's test proves; were one not held, its path would stand
// for its label.
function labelledIn(build: Build): (missing: MissingSpecification) => MissingInABuild {
  return ({ part: partId, path }) => {
    const part = build
      .getParts()
      .find((each) => each.getPart().getId() === partId)
      ?.getPart();
    const labels = part && specificationListOf(part.getCategory()).labelsAt(path);
    return new MissingInABuild(partId, path, labels?.label ?? path, labels?.fieldLabel);
  };
}
