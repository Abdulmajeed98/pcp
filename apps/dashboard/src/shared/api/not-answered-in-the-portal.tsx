import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';

import { Trans, useTranslation } from '@/shared/i18n';

import { Refusal } from './answer';

// Why the API did not answer, in the Vendor portal's language: it refused,
// with its status and its error's code, kept in English, or it could not be
// reached. A screen puts it under a title of its own that says what was not
// done, as the Admin console's `WhyNotAnswered` is put.
export function WhyNotAnsweredInThePortal({ error }: { error: Error }) {
  const { t } = useTranslation();

  return error instanceof Refusal ? (
    <Trans
      i18nKey="NotAnswered.refused"
      components={{
        refusal: (
          <AlwaysEnglish>{`${formatNumber(error.status)}, ${error.code}`}</AlwaysEnglish>
        ),
      }}
    />
  ) : (
    <>{t('NotAnswered.unreachable')}</>
  );
}
