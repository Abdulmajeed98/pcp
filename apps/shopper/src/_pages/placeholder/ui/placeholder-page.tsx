import { libraries } from '@/shared/config';

import { readApiStatus } from '../api/read-api-status';

// Placeholder: scaffolding, not a screen. It shows one thing fetched from the
// API on the server, which is the pattern every Shopper page copies. The first
// real page replaces it, and from then on every page is built in all three
// languages and both directions.
export async function PlaceholderPage() {
  const status = await readApiStatus();

  return (
    <>
      <p>Shopper app placeholder. Libraries: {libraries.join(', ')}.</p>
      {status === undefined ? (
        <p>The API cannot be reached.</p>
      ) : (
        <p>
          The API started at <time dateTime={status.startedAt}>{status.startedAt}</time>.
        </p>
      )}
    </>
  );
}
