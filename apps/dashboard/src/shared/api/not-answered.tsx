import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';

import { Refusal } from './answer';

// Why the API did not answer, in words: it refused, with its status and its
// error's code, or it could not be reached. A screen puts it under a title of
// its own that says what was not done.
export function WhyNotAnswered({ error }: { error: Error }) {
  return error instanceof Refusal ? (
    <>
      The API refused, with{' '}
      <AlwaysEnglish>{`${formatNumber(error.status)}, ${error.code}`}</AlwaysEnglish>.
    </>
  ) : (
    <>The API cannot be reached. Check the connection, and try again.</>
  );
}
