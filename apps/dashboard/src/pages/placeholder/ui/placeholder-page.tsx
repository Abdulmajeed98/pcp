import { useEffect, useState } from 'react';

import { logOut } from '@/shared/auth';
import { libraries } from '@/shared/config';

import { type CallerAnswer, readCaller } from '../api/read-caller';

// Placeholder: scaffolding, not a screen. It shows who the API says the
// caller is, which proves the login, the call and the API's check of the
// token. The first real Vendor portal or Admin console page replaces it.
//
// The bar that marks it as a placeholder is on the start side, which is the
// left in English and the right in Kurdish and Arabic. A class that has a
// side is always written that way, with start and end.
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
    <main className="m-4 border-s-4 ps-4">
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
        <p data-testid="unreachable">
          The call could not be made: the API or the login service cannot be reached.
        </p>
      )}
      {/* Tailwind CSS takes away the look a browser gives a button, so each
          keeps a plain border to be told from the text around it. */}
      <button type="button" className="me-2 border px-2" onClick={askAgain}>
        Ask the API again
      </button>
      <button type="button" className="border px-2" onClick={() => void logOut()}>
        Log out
      </button>
    </main>
  );
}
