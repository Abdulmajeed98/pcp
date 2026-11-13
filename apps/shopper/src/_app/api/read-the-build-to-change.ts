import { type Build, heldByTheCatalog, partValuesOf } from '@/entities/build';
import { apiClient } from '@/shared/api';
import { chosenCurrency } from '@/shared/currency';

// The Build a form changes, as the catalog holds it, read on the server for
// each change, with no cache (the builder spec's The Build in the Shopper's
// browser): the Build its cookie holds, read through `GET v1/build`, keeping
// the Parts the API answers and forgetting those the catalog no longer
// holds, so that a vanished kit or drive counts toward no limit and the
// cookie the change writes no longer names it. A Build the API refuses, or
// does not answer, is changed as its cookie holds it: the Build page says
// what is refused, and an API that does not answer cannot say which Parts
// the catalog holds. An empty Build is not asked about.
export async function readTheBuildToChange(build: Build): Promise<Build> {
  if (build.length === 0) return build;

  const { data } = await apiClient().readBuild({
    query: { currency: await chosenCurrency(), part: partValuesOf(build) },
    cache: 'no-store',
  });
  return data === undefined
    ? build
    : heldByTheCatalog(
        build,
        data.parts.map(({ id }) => id),
      );
}
