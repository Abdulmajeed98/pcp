import { isUuid } from '~/domain/uuid';

// Whether an identifier has the form the database holds, a UUID. Anything
// else names nothing, and is never sent to the database, which would refuse
// it.
export function couldBeIdentifier(id: string): boolean {
  return isUuid(id);
}
