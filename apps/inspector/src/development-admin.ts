import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import type { Login } from './chrome.ts';

const repositoryRoot = new URL('../../../', import.meta.url);

// The development Admin's name and password, from `.env`, as
// `pnpm services:up` wrote them. Neither is ever printed.
export function developmentAdmin(): Login {
  let settings: Record<string, string | undefined>;
  try {
    settings = parseEnv(readFileSync(new URL('.env', repositoryRoot), 'utf8'));
  } catch {
    throw new Error(
      'There is no .env at the repository root. Start the services with "pnpm services:up".',
    );
  }
  const name = settings.DEVELOPMENT_ADMIN_NAME;
  const password = settings.DEVELOPMENT_ADMIN_PASSWORD;
  if (!name || !password) {
    throw new Error(".env does not hold the development Admin's name and password.");
  }
  return { name, password };
}
