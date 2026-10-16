import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { formatNumber } from '@pcp/i18n';
import { useEffect, useState } from 'react';

import { logOut } from '@/shared/auth';
import { Trans, useTranslation } from '@/shared/i18n';

import { type CallerAnswer, readCaller } from '../api/read-caller';

// Placeholder: scaffolding, not a screen. It shows who the API says the
// caller is, which proves the login, the call and the API's check of the
// token, with a button to ask again and one to log out. Both halves of the
// dashboard show it, so its text is in the language files, and in the Admin
// console it shows the English.
//
// The login's name is shown as it was written, and the role names are the
// API's own, in English. Each is put into the element its sentence names.
//
// Every button is at least 44 pixels high, with the corners of a control,
// and its border is drawn in the colour of a control's edge, which stands
// out from the page at 3:1.
export function CallerPanel() {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<CallerAnswer | undefined>(undefined);

  useEffect(() => {
    void readCaller().then(setAnswer);
  }, []);

  function askAgain() {
    setAnswer(undefined);
    void readCaller().then(setAnswer);
  }

  return (
    <div className="flex flex-col gap-4">
      {answer === undefined && <p>{t('Caller.asking')}</p>}
      {answer?.kind === 'caller' && (
        <p>
          <Trans
            i18nKey="Caller.answer"
            components={{
              name: (
                <AsWritten data-testid="caller-name" className="font-semibold">
                  {answer.caller.loginName}
                </AsWritten>
              ),
              roles: (
                <AlwaysEnglish data-testid="caller-roles">
                  {answer.caller.roles.join(', ')}
                </AlwaysEnglish>
              ),
            }}
          />
        </p>
      )}
      {answer?.kind === 'refused' && (
        <p data-testid="refusal">
          <Trans
            i18nKey="Caller.refused"
            components={{
              refusal: (
                <AlwaysEnglish>{`${formatNumber(answer.status)}, ${answer.code}`}</AlwaysEnglish>
              ),
            }}
          />
        </p>
      )}
      {answer?.kind === 'unreachable' && (
        <p data-testid="unreachable">{t('Caller.unreachable')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-control rounded-lg border border-input px-3"
          onClick={askAgain}
        >
          {t('Caller.askAgain')}
        </button>
        <button
          type="button"
          data-testid="log-out"
          className="min-h-control rounded-lg border border-input px-3"
          onClick={() => void logOut()}
        >
          {t('Caller.logOut')}
        </button>
      </div>
    </div>
  );
}
