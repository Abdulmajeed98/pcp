// The outcome of one Compatibility Rule that applies to a Build (CMP-3), by
// the rule's number. It passes, finds a Compatibility Problem or finds a
// Compatibility Warning, naming the Parts it is about by their identifiers;
// or it is unchecked, naming each missing needed specification that could
// change it. An unchecked rule is never a pass.
export type RuleOutcome =
  | {
      readonly rule: number;
      readonly outcome: 'passes' | 'problem' | 'warning';
      readonly parts: readonly string[];
    }
  | {
      readonly rule: number;
      readonly outcome: 'unchecked';
      readonly missing: readonly MissingSpecification[];
    };

// A needed specification that a Part of the Build lacks: the Part, by its
// identifier, and the specification, by its path, such as `memory.slots`.
export type MissingSpecification = {
  readonly part: string;
  readonly path: string;
};
