// Whether an identifier has the form the database holds. Anything else names
// nothing, and is never sent to the database, which would refuse it.
export function couldBeIdentifier(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
