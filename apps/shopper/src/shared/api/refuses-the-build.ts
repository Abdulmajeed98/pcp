import type { ErrorResponse } from '@pcp/api-client';

import { theApisErrors } from './the-apis-errors';

// Whether the API's answer refuses the Build it was given, as `GET v1/build`
// and the picker's list refuse one: 400 with an error that names `part`, the
// Build's parameter. The Shopper app sends no Build the API refuses from a
// cookie it wrote, but a cookie edited by hand, such as one that files a RAM
// kit under the CPU, is read as what can be read of it and may still be
// refused. That is told apart from an API that does not answer, which has
// no response, from one that fails, and from a 400 whose body is not the
// API's, as a proxy's in front of it, which is read as no answer.
export function refusesTheBuild({
  status,
  error,
}: {
  status: number | undefined;
  error: ErrorResponse | undefined;
}): boolean {
  return (
    status === 400 &&
    theApisErrors(error).some((each) => each.additionalInformation?.field === 'part')
  );
}
