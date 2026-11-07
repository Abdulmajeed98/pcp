// One value a rule reads: a Part's value at a specification's path, or none
// when the Part was not given it, which makes it missing.
export type Reading<Value> = {
  readonly part: string;
  readonly path: string;
  readonly value: Value | undefined;
};

// Each row of a list a Part holds, such as a motherboard's PCIe slots, read
// at one of its fields and named by the list's path, the row's place and the
// field's name, such as `pcie_slots.0.lanes`, as the API names it; or none
// when the list is missing.
export function rowsOf<Row, Field extends keyof Row & string>(
  list: Reading<readonly Row[]>,
  field: Field,
): Reading<NonNullable<Row[Field]>>[] | undefined {
  return list.value?.map((row, place) => ({
    part: list.part,
    path: `${list.path}.${place}.${field}`,
    value: row[field] ?? undefined,
  }));
}
