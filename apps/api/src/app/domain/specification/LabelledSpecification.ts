import type { Specification, SpecificationKind } from './Specification';

// The rows a Part holds for a list of rows, each as the fields it holds, in
// the order of the list's fields. A Part may hold no rows: a motherboard with
// no M.2 slot holds none.
export class LabelledRows {
  constructor(private readonly rows: readonly (readonly LabelledSpecification[])[]) {}

  getRows(): readonly (readonly LabelledSpecification[])[] {
    return this.rows;
  }
}

// What a Part holds for one specification: a number, a text, yes or no as a
// boolean, a choice of several or a list of text, or a list of rows.
export type LabelledValue = number | string | boolean | readonly string[] | LabelledRows;

// One specification a Part holds, with its value, as Shoppers read it: beside
// the specification's English label and its unit (LANG-3).
export class LabelledSpecification {
  constructor(
    private readonly specification: Specification,
    private readonly value: LabelledValue,
  ) {}

  // Its place in a Part's specifications, or, for a field of a row, its name
  // in the row.
  getPath(): string {
    return this.specification.getPath();
  }

  getLabel(): string {
    return this.specification.getLabel();
  }

  getKind(): SpecificationKind {
    return this.specification.getKind();
  }

  getUnit(): string | undefined {
    return this.specification.getUnit();
  }

  getValue(): LabelledValue {
    return this.value;
  }
}
