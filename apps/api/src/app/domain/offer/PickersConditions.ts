// The picker's conditions on a Category's list (BLD-2, BLD-3), which travel
// together from the request to the use case: in stock only, which keeps the
// Visible Parts with an in-stock Visible Offer; the Build so far, its `part`
// values as the request gives them, before they are read as the Build each
// Part is judged against; and the switch, which keeps the Parts that are not
// Compatible with it. A Category page asks with none of them.
export class PickersConditions {
  constructor(
    private readonly inStockOnly: boolean,
    private readonly partValues: readonly string[],
    private readonly keepNotCompatible: boolean,
  ) {}

  // Whether only the Visible Parts with an in-stock Visible Offer are asked
  // for (BLD-2).
  isInStockOnly(): boolean {
    return this.inStockOnly;
  }

  // The Build's `part` values, as the request gives them; none without a
  // Build, and then no Part is judged.
  getPartValues(): readonly string[] {
    return this.partValues;
  }

  // Whether they give a Build, against which each Part is judged (BLD-3).
  givesABuild(): boolean {
    return this.partValues.length > 0;
  }

  // Whether the Parts that are not Compatible with the Build are kept, as the
  // switch asks; they are left out otherwise.
  isKeepingNotCompatible(): boolean {
    return this.keepNotCompatible;
  }
}
