import { useEffect, useState } from 'react';

import { logOut } from '@/shared/auth';
import { libraries } from '@/shared/config';

import { type CallerAnswer, readCaller } from '../api/read-caller';

// Placeholder: scaffolding, not a screen. It shows who the API says the
// caller is, which proves the login, the call and the API's check of the
// token. The first real Vendor portal or Admin console page replaces it.
export function PlaceholderPage() {
  const [answer, setAnswer] = useState<CallerAnswer | undefined>(undefined);

  useEffect(() => {
    void readCaller().then(setAnswer);
  }, []);

  function askAgain() {
    setAnswer(undefined);
    void readCaller().then(setAnswer);
  }

  return (
    <>
      <p>Dashboard placeholder. Libraries: {libraries.join(', ')}.</p>
      {answer === undefined && <p>Asking the API who the caller is.</p>}
      {answer?.kind === 'caller' && (
        <p>
          The API says the caller is{' '}
          <strong data-testid="caller-name">{answer.caller.loginName}</strong>, with the
          role <span data-testid="caller-roles">{answer.caller.roles.join(', ')}</span>.
        </p>
      )}
      {answer?.kind === 'refused' && (
        <p data-testid="refusal">
          The API refused the call: {answer.status}, {answer.code}.
        </p>
      )}
      {answer?.kind === 'unreachable' && (
        <p data-testid="unreachable">The API cannot be reached.</p>
      )}
      <button type="button" onClick={askAgain}>
        Ask the API again
      </button>{' '}
      <button type="button" onClick={() => void logOut()}>
        Log out
      </button>
    </>
  );
}
