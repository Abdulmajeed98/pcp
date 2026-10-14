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

// Every specification a Part of one Category can hold.
export class SpecificationList {
  constructor(private readonly specifications: readonly Specification[]) {}

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

  // The needed specifications a Part's specifications do not hold, by their
  // paths, in the list's order.
  missingNeeded(document: SpecificationDocument): string[] {
    return this.specifications
      .filter((specification) => specification.isNeeded())
      .map((specification) => specification.getPath())
      .filter((path) => valueAt(document, path) === undefined);
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
