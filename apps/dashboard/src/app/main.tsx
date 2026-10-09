import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { startLogin } from '@/shared/auth';

import { App } from './app';

const root = createRoot(document.getElementById('root') as HTMLElement);

// The login is started here, once, before React renders anything, so that
// development mode's double rendering cannot start it twice. Nothing of the
// dashboard is shown to someone who has not logged in.
startLogin().then(
  () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  },
  () => {
    root.render(<p>The login could not be completed. Keycloak may be unreachable.</p>);
  },
);
