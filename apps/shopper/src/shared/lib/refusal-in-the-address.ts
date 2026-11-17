// A form refused comes back to the page it was sent from, 303, with why in
// the page's address, `?refused=<reason>`, and what else the refusal names,
// so that the page says it, with script and without (the builder spec's
// forms, the sharing spec's The Shopper app). Sharing, copying and sending
// each write and read their refusals so, each with its own reasons.

// A query a page reads its address from.
interface Query {
  get(name: string): string | null;
}

// The address a refused form is answered with: the page, its address as
// the page writes it, the refusal's reason and what else it names in the
// query, in that order, and an anchor the page opens at, when it has one.
export function addressWithARefusal(
  page: string,
  refusal: { refused: string } & Record<string, string>,
  anchor?: string,
): string {
  const query = new URLSearchParams(refusal).toString();
  return `${page}?${query}${anchor === undefined ? '' : `#${anchor}`}`;
}

// The reason a page's address gives for a refused form, when it is one of
// the reasons the form knows, or nothing: another form's refusal, or an
// address changed by hand, says nothing of this one.
export function refusalIn<Reason extends string>(
  query: Query,
  reasons: readonly Reason[],
): Reason | undefined {
  const reason = query.get('refused');
  return reasons.find((each) => each === reason);
}
