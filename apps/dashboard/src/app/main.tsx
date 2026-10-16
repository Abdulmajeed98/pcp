import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { realmRolesOfTheLogin, startLogin } from '@/shared/auth';
import { startLanguage } from '@/shared/i18n';

import { App } from './app';
import { halfFor, halves } from './halves';
import { LoginFailed } from './login-failed';
import './styles/global.css';

const root = createRoot(document.getElementById('root') as HTMLElement);

// The login is started here, once, before React renders anything, so that
// development mode's double rendering cannot start it twice. Nothing of the
// dashboard is shown to someone who has not logged in.
//
// Once someone has, the rule for which half they get is applied, once, to
// the roles their login holds. The half decides the language, and the
// document declares it, with its direction and its title, before anything is
// rendered.
startLogin().then(
  async () => {
    const half = halfFor(realmRolesOfTheLogin());
    await startLanguage(halves[half].language(), halves[half].title);

    root.render(
      <StrictMode>
        <App half={half} />
      </StrictMode>,
    );
  },
  async () => {
    await startLanguage(halves['vendor-portal'].language(), halves['vendor-portal'].title);

    root.render(
      <StrictMode>
        <LoginFailed />
      </StrictMode>,
    );
  },
);
