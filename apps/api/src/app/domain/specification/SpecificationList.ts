import { type CategoryKey, neededSpecificationsOf } from '@pcp/compatibility';

import { LabelledSpecification } from './LabelledSpecification';
import { Specification, SpecificationProblem } from './Specification';
import {
  isPlainObject,
  setAt,
  SpecificationDocument,
  valueAt,
} from './specification-document';

// What checking a Part's specifications gives: the ones that fit, as they are
// kept, and what did not fit. Creating a Part refuses any problem. The import
// leaves the values with problems out, and counts them.
//
// This is a plain value and not an `Either`, because a check that finds
// problems still gives what fits: the import keeps that. A use case turns a
// problem into the left side of its own `Either`.
export type SpecificationCheck = {
  document: SpecificationDocument;
  problems: SpecificationProblem[];
};

// The English labels that name a specification to Shoppers (LANG-3): its
// own, or, for a field of a row, the list's and the field's.
export type SpecificationLabels = {
  label: string;
  fieldLabel?: string;
};

// Every specification a Part of one Category can hold, the Category given by
// its key, which the list is found by. No list marks a needed specification:
// one is needed when the library's statements of the Compatibility Rules name
// its path for the list's Category, so that what the Admin is asked to fill
// in is what the rules read. A path the statements name that the list lacks
// marks nothing, and the API still starts (ADR-0004: domain code never
// throws); the Categories endpoint's test proves that none is.
export class SpecificationList {
  private readonly needed: ReadonlySet<Specification>;

  constructor(
    private readonly category: CategoryKey,
    private readonly specifications: readonly Specification[],
  ) {
    const paths = new Set(neededSpecificationsOf(category));
    this.needed = new Set(
      specifications.filter((specification) => paths.has(specification.getPath())),
    );
  }

  getCategoryKey(): CategoryKey {
    return this.category;
  }

  getSpecifications(): readonly Specification[] {
    return this.specifications;
  }

  // Checks every value against its specification, in the list's order, and
  // then names each value the list has no place for.
  check(document: SpecificationDocument): SpecificationCheck {
    const kept: SpecificationDocument = {};
    const problems: SpecificationProblem[] = [];

    for (const specification of this.specifications) {
      const checked = specification.check(valueAt(document, specification.getPath()));
      if (checked.value !== undefined) setAt(kept, specification.getPath(), checked.value);
      problems.push(...checked.problems);
    }

    return {
      document: kept,
      problems: [...problems, ...this.outsideTheList(document, '')],
    };
  }

  // The specifications a Compatibility Rule reads, in the list's order.
  getNeeded(): readonly Specification[] {
    return this.specifications.filter((specification) => this.isNeeded(specification));
  }

  // Whether a Compatibility Rule reads a specification of the list, or a
  // field of one of its lists of rows, which none does: a rule that reads a
  // list of rows, such as a motherboard's PCIe slots, names the list.
  isNeeded(specification: Specification): boolean {
    return this.needed.has(specification);
  }

  // The needed specifications a Part's specifications do not hold, by their
  // paths, in the list's order.
  missingNeeded(document: SpecificationDocument): string[] {
    return this.getNeeded()
      .filter((specification) =>
        specification.isMissingIn(valueAt(document, specification.getPath())),
      )
      .map((specification) => specification.getPath());
  }

  // The needed specifications a Part's specifications hold, at their paths,
  // as the Compatibility Rules are handed them: each one it lacks, and each
  // field of a row it lacks, as `Specification.heldIn` says, is left out, so
  // that the rules never take a value the catalog counts as not known for a
  // real one.
  neededHeldIn(document: SpecificationDocument): SpecificationDocument {
    const held: SpecificationDocument = {};
    for (const specification of this.getNeeded()) {
      const value = specification.heldIn(valueAt(document, specification.getPath()));
      if (value !== undefined) setAt(held, specification.getPath(), value);
    }
    return held;
  }

  // The English labels of the specification at a path, as a Compatibility
  // Rule names it: its own, or, for a field of a row, such as
  // `pcie_slots.0.lanes`, the list's and the field's. None for a path the
  // list does not hold.
  labelsAt(path: string): SpecificationLabels | undefined {
    const specification = this.specifications.find((each) => each.getPath() === path);
    if (specification !== undefined) return { label: specification.getLabel() };

    const list = this.specifications.find(
      (each) => each.getKind() === 'listOfRows' && path.startsWith(`${each.getPath()}.`),
    );
    if (list === undefined) return undefined;
    // After the list's path come the row's place and the field's name.
    const [, fieldName] = path.slice(list.getPath().length + 1).split('.');
    const field = list.getFields()?.find((each) => each.getPath() === fieldName);
    return field === undefined
      ? undefined
      : { label: list.getLabel(), fieldLabel: field.getLabel() };
  }

  // The specifications a Part's specifications hold, labelled, in the list's
  // order, leaving out each one it lacks, as `Specification.labelled` says.
  labelledIn(document: SpecificationDocument): LabelledSpecification[] {
    return this.specifications.flatMap((specification) => {
      const held = specification.labelled(valueAt(document, specification.getPath()));
      return held === undefined ? [] : [held];
    });
  }

  // A name no specification has, whatever its value, null included. A name
  // with specifications inside it, such as a GPU's `power_connectors`, holds
  // an object that is looked into, or null, when they are all missing.
  // Anything else there is not a group of values, and the specifications in
  // it are lost with it.
  private outsideTheList(
    node: SpecificationDocument,
    prefix: string,
  ): SpecificationProblem[] {
    return Object.entries(node).flatMap(([name, value]) => {
      const path = prefix === '' ? name : `${prefix}.${name}`;
      if (this.specifications.some((each) => each.getPath() === path)) return [];

      const holdsSpecifications = this.specifications.some((each) =>
        each.getPath().startsWith(`${path}.`),
      );
      if (holdsSpecifications && (value === null || value === undefined)) return [];
      if (holdsSpecifications && isPlainObject(value)) {
        return this.outsideTheList(value, path);
      }
      return [{ path, reason: holdsSpecifications ? 'notAGroup' : 'unknown' }];
    });
  }
}
