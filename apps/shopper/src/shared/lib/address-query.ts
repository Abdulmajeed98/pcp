// The query of a page's address, as Next hands it to the page: each
// parameter's value, or its values when it is repeated.
export type AddressQuery = Record<string, string | string[] | undefined>;

// The query's fields, each value of a repeated parameter on its own, in the
// order the address gives them, as a form's fields and `URLSearchParams`
// take them: how a page writes its own address again, as it was asked, or
// reads a parameter Next has handed it. A parameter with no value is none.
export function fieldsOf(address: AddressQuery): [string, string][] {
  return Object.entries(address).flatMap(([name, values]) =>
    [values ?? []].flat().map((value): [string, string] => [name, value]),
  );
}
