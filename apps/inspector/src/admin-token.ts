import { createHash, randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import { CannotInspect, type Login, until } from './chrome.ts';
import type { TasteBrowser } from './taste.ts';

// The development Admin's token, for the Shopper's inspection's one reading
// of the catalog, which only a login may search. Keycloak gives a token only
// to a login made at its own login screen (the realm refuses the password
// flow), so the Admin logs in there in a tab of the inspector's Chrome, the
// way a person does, through the dashboard's client, with its PKCE. The
// dashboard itself is not needed: Chrome's request for the dashboard's
// address that Keycloak sends it back to is answered in the tab, and its
// code is traded for a token here. Neither the name nor the password is ever
// printed, nor put in an address.

// Where Keycloak is and the dashboard's client in it, as the dashboard's
// settings have them.
export interface KeycloakClient {
  url: string;
  realm: string;
  clientId: string;
  // An address the client may be sent back to.
  redirectUri: string;
}

interface PausedRequest {
  requestId: string;
  request: { url: string };
}

function base64Url(bytes: Buffer): string {
  return bytes.toString('base64url');
}

export async function tokenOfTheDevelopmentAdmin(
  browser: TasteBrowser,
  keycloak: KeycloakClient,
  login: Login,
): Promise<string> {
  const verifier = base64Url(randomBytes(32));
  const state = base64Url(randomBytes(16));
  const realm = `${keycloak.url}/realms/${keycloak.realm}/protocol/openid-connect`;
  const authorize = new URL(`${realm}/auth`);
  for (const [name, value] of Object.entries({
    client_id: keycloak.clientId,
    redirect_uri: keycloak.redirectUri,
    response_type: 'code',
    scope: 'openid',
    state,
    code_challenge: base64Url(createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
  })) {
    authorize.searchParams.set(name, value);
  }

  const page = await browser.newPage({ width: 1024, height: 800 });
  try {
    let code: string | undefined;
    browser.on(page.sessionId, 'Fetch.requestPaused', (paused: PausedRequest) => {
      const back = new URL(paused.request.url);
      if (back.searchParams.get('state') === state)
        code = back.searchParams.get('code') ?? '';
      void page
        .send('Fetch.fulfillRequest', {
          requestId: paused.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
          body: Buffer.from('<!doctype html><title>Logged in</title>').toString('base64'),
        })
        .catch(() => {});
    });
    await page.send('Fetch.enable', {
      patterns: [
        {
          urlPattern: `${new URL(keycloak.redirectUri).origin}/*`,
          requestStage: 'Request',
        },
      ],
    });

    await page.goto(authorize.href, { timeoutMs: 30000, settleMs: 0 });
    if (!(await until(page, `document.querySelector('#kc-form-login')`, 15000))) {
      throw new CannotInspect(
        "Keycloak's login screen did not show, so the catalog could not be read for the made-up shop.",
      );
    }
    await page.eval(`(() => {
      const login = ${JSON.stringify(login)};
      document.querySelector('#username').value = login.name;
      document.querySelector('#password').value = login.password;
      document.querySelector('#kc-login').click();
    })()`);
    for (let waited = 0; code === undefined && waited < 20000; waited += 100) {
      await sleep(100);
    }
    if (code === undefined || code === '') {
      const said = await page
        .eval(
          `document.querySelector('#input-error, .kc-feedback-text, .alert-error')?.textContent?.trim() ?? ''`,
        )
        .catch(() => '');
      throw new CannotInspect(
        `The development Admin's login at Keycloak did not finish${said ? `: Keycloak says "${String(said)}"` : ''}. Nothing was started.`,
      );
    }

    const answer = await fetch(`${realm}/token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: keycloak.clientId,
        code,
        redirect_uri: keycloak.redirectUri,
        code_verifier: verifier,
      }),
    });
    const token = (await answer.json().catch(() => ({}))) as { access_token?: string };
    if (!answer.ok || token.access_token === undefined) {
      throw new CannotInspect(
        `Keycloak answered ${answer.status} when the login's code was traded for a token. Nothing was started.`,
      );
    }
    return `Bearer ${token.access_token}`;
  } finally {
    await page.close();
  }
}
