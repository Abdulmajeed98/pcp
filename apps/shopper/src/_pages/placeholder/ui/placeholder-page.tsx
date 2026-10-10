import { libraries } from '@/shared/config';

import { readApiStatus } from '../api/read-api-status';

// Placeholder: scaffolding, not a screen. It shows one thing fetched from the
// API on the server, which is the pattern every Shopper page copies. The first
// real page replaces it, and from then on every page is built in all three
// languages and both directions.
//
// The bar that marks it as a placeholder is on the start side, which is the
// left in English and the right in Kurdish and Arabic. A class that has a
// side is always written that way, with start and end.
export async function PlaceholderPage() {
  const status = await readApiStatus();

  return (
    <main className="m-4 border-s-4 ps-4">
      <p>Shopper app placeholder. Libraries: {libraries.join(', ')}.</p>
      {status === undefined ? (
        <p>The API cannot be reached.</p>
      ) : (
        <p>
          The API started at <time dateTime={status.startedAt}>{status.startedAt}</time>.
        </p>
      )}
    </main>
  );
}
