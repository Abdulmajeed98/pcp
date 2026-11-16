// A Shared Build: a frozen copy of a Build's Parts and quantities, stored by
// the platform behind a link, which never changes (SHR-1, SHR-3). It holds
// the Build's `part` values as `GET v1/build` takes them, and nothing about
// the Shopper who shared it.
export class SharedBuild {
  constructor(
    private readonly id: string,
    private readonly partValues: readonly string[],
    private readonly sharedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  // The frozen `part` values: lower-case identifiers, in the catalog's order
  // of Categories, then the Build's order for RAM kits and drives, each kit
  // or drive followed by `:` and its quantity. A Part that has left the
  // catalog since stays among them.
  getPartValues(): readonly string[] {
    return this.partValues;
  }

  // When it was first shared, by the API's clock.
  getSharedAt(): Date {
    return this.sharedAt;
  }
}
