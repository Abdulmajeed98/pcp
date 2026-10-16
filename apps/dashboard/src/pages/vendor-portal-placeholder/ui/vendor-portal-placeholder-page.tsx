import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';

import { Trans, useTranslation } from '@/shared/i18n';
import { CallerPanel } from '@/widgets/caller';

// The sample: one of each kind of text a later screen will hold, with the
// values the Shopper app's placeholder page shows. Every value is fixed
// here. No Part and no Vendor has the names in it, and its figures are made
// up.
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

// Placeholder: scaffolding, not a screen. The Vendor portal's first real page
// replaces it, sample and all. It is in the Vendor's language, inside the
// Vendor portal's frame.
//
// A number is written by `formatNumber` and put into the element its message
// names for it, such as `<count/>`. No message formats one itself. A
// sentence that counts is also given the count, which picks its wording.
// What is in English in every language is marked so, and kept apart from the
// sentence around it.
export function VendorPortalPlaceholderPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <p data-testid="placeholder-notice">{t('VendorPortalPlaceholder.notice')}</p>
      <CallerPanel />
      <p>{t('VendorPortalPlaceholder.sample')}</p>
      <ul data-testid="category-names">
        {sampleCategories.map((key) => (
          <li key={key}>{t(`Category.${key}`)}</li>
        ))}
      </ul>
      <ul>
        {sampleCounts.map((count) => (
          <li key={count} data-testid="counted-sentence">
            <Trans
              i18nKey="VendorPortalPlaceholder.partsFound"
              count={count}
              components={{ count: <>{formatNumber(count)}</> }}
            />
          </li>
        ))}
      </ul>
      <p>
        <Trans
          i18nKey="VendorPortalPlaceholder.readsAt"
          components={{
            speed: (
              <AlwaysEnglish>{`${formatNumber(sampleSpeed.amount)} ${sampleSpeed.unit}`}</AlwaysEnglish>
            ),
          }}
        />
      </p>
      <p>
        <Trans
          i18nKey="VendorPortalPlaceholder.partLength"
          components={{
            part: <AlwaysEnglish>{samplePart.name}</AlwaysEnglish>,
            length: <AlwaysEnglish>{samplePart.length}</AlwaysEnglish>,
          }}
        />
      </p>
      {sampleAsWritten.map((line) => (
        <p key={line}>
          <AsWritten data-testid="as-written">{line}</AsWritten>
        </p>
      ))}
    </div>
  );
}
