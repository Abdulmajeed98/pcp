import { type Category as CategoryKey, neededSpecificationsOf } from '@pcp/compatibility';

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

// Every specification a Part of one Category can hold, the Category given by
// its key. No list marks a needed specification: one is needed when the
// library's statements of the Compatibility Rules name its path for the
// list's Category, so that what the Admin is asked to fill in is what the
// rules read. A path the statements name that the list lacks marks nothing,
// and the API still starts (ADR-0004: domain code never throws); the
// Categories endpoint's test proves that none is.
export class SpecificationList {
  private readonly needed: ReadonlySet<string>;

  constructor(
    category: CategoryKey,
    private readonly specifications: readonly Specification[],
  ) {
    this.needed = new Set(neededSpecificationsOf(category));
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

  // Whether a Compatibility Rule reads one of the list's specifications. A
  // rule that reads a list of rows, such as a motherboard's PCIe slots, names
  // the list and none of its rows' fields.
  isNeeded(specification: Specification): boolean {
    return this.needed.has(specification.getPath());
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
