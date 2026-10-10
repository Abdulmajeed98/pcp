import { getTranslations } from 'next-intl/server';

import { libraries } from '@/shared/config';

import { readApiStatus } from '../api/read-api-status';

// Placeholder: scaffolding, not a screen. It shows one thing fetched from the
// API on the server, in the Shopper's language, which is the pattern every
// Shopper page copies: a page reads its text on the server, from the language
// files, and none of that text is sent to the browser as data. The first real
// page replaces it.
//
// Its text is set in from the start side, which is the left in English and
// the right in Kurdish and Arabic. A class that has a side is always written
// that way, with start and end.
export async function PlaceholderPage() {
  const [t, status] = await Promise.all([
    getTranslations('PlaceholderPage'),
    readApiStatus(),
  ]);

  return (
    <div className="ps-4">
      <p data-testid="placeholder">{t('notice', { libraries: libraries.join(', ') })}</p>
      {status === undefined ? (
        <p>{t('apiUnreachable')}</p>
      ) : (
        <p>
          {t.rich('apiStartedAt', {
            startedAt: status.startedAt,
            time: (chunks) => <time dateTime={status.startedAt}>{chunks}</time>,
          })}
        </p>
      )}
    </div>
  );
}
