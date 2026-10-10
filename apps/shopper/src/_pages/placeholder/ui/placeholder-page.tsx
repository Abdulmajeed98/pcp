import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { libraries } from '@/shared/config';

import { readApiStatus } from '../api/read-api-status';

// The sample: one of each kind of text a later screen will hold. Every value
// is fixed here. No Part and no Vendor has the names in it, and its figures
// are made up.
//
// The eight Categories, by the keys of their names in the shared terms.
const sampleCategories = [
  'cpu',
  'cpuCooler',
  'motherboard',
  'ram',
  'storage',
  'gpu',
  'case',
  'psu',
] as const;
// A sentence that counts is shown for each of these counts. Between them they
// take every plural form Arabic has but the one for nothing.
const sampleCounts = [1, 2, 3, 11, 100];
// A number beside its unit.
const sampleSpeed = { amount: 1575000, unit: 'IOPS' };
// A Part name and a specification, which are in English in every language.
// Each starts with a number, which is the text a Kurdish or an Arabic
// sentence reorders when nothing keeps it apart.
const samplePart = { name: '500 Sample 1TB', length: '80 mm' };
// Two lines as someone wrote them. The first starts in Arabic script and
// holds Latin script too, and the second is in Latin script and starts with
// a number.
const sampleAsWritten = ['حاسبات المثال (Example Computers)', '12 Sample Street, Erbil'];

// What a message's `<english>` tag becomes: text that is the same in every
// language and runs left to right, kept apart from the sentence around it.
// The names of the libraries and the time the API started are such text too.
// Unmarked, a Kurdish sentence draws "@pcp/compatibility" with its "@" at the
// far end.
function english(chunks: ReactNode) {
  return <AlwaysEnglish>{chunks}</AlwaysEnglish>;
}

// Placeholder: scaffolding, not a screen. It shows one thing fetched from the
// API on the server, in the Shopper's language, which is the pattern every
// Shopper page copies: a page reads its text on the server, from the language
// files, and none of that text is sent to the browser as data. The first real
// page replaces it, sample and all.
//
// A number is written by `formatNumber` and reaches a message as text. No
// message formats one itself.
//
// Its text is set in from the start side, which is the left in English and
// the right in Kurdish and Arabic. A class that has a side is always written
// that way, with start and end.
export async function PlaceholderPage() {
  const [t, categoryName, status] = await Promise.all([
    getTranslations('PlaceholderPage'),
    getTranslations('Category'),
    readApiStatus(),
  ]);

  return (
    <div className="ps-4">
      <p data-testid="placeholder">
        {t.rich('notice', { libraries: libraries.join(', '), english })}
      </p>
      {status === undefined ? (
        <p>{t('apiUnreachable')}</p>
      ) : (
        <p>
          {t.rich('apiStartedAt', {
            startedAt: status.startedAt,
            time: (chunks) => english(<time dateTime={status.startedAt}>{chunks}</time>),
          })}
        </p>
      )}
      <p>{t('sample')}</p>
      <ul data-testid="category-names">
        {sampleCategories.map((key) => (
          <li key={key}>{categoryName(key)}</li>
        ))}
      </ul>
      <ul>
        {sampleCounts.map((count) => (
          <li key={count} data-testid="counted-sentence">
            {t('partsFound', { count, countText: formatNumber(count) })}
          </li>
        ))}
      </ul>
      <p>
        {t.rich('readsAt', {
          speed: `${formatNumber(sampleSpeed.amount)} ${sampleSpeed.unit}`,
          english,
        })}
      </p>
      <p>
        {t.rich('partLength', {
          part: samplePart.name,
          length: samplePart.length,
          english,
        })}
      </p>
      {sampleAsWritten.map((line) => (
        <p key={line}>
          <AsWritten data-testid="as-written">{line}</AsWritten>
        </p>
      ))}
    </div>
  );
}
