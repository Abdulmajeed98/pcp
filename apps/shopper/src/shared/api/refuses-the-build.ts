import type { ErrorResponse } from '@pcp/api-client';

// Whether the API's answer refuses the Build it was given, as `GET v1/build`
// and the picker's list refuse one: 400 with an error that names `part`, the
// Build's parameter. The Shopper app sends no Build the API refuses from a
// cookie it wrote, but a cookie edited by hand, such as one that files a RAM
// kit under the CPU, is read as what can be read of it and may still be
// refused. That is told apart from an API that does not answer, which has
// no response, and from one that fails.
export function refusesTheBuild({
  status,
  error,
}: {
  status: number | undefined;
  error: ErrorResponse | undefined;
}): boolean {
  return (
    status === 400 &&
    (error?.errors.some((each) => each.additionalInformation?.field === 'part') ?? false)
  );
}
