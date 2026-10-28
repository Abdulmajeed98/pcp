import { setTimeout as sleep } from 'node:timers/promises';

import {
  answerFromTheMadeUpShop,
  listsTheVendors,
  type MadeUpShop,
  type ShopAnswer,
  vendorsWithTheShops,
} from './made-up-shop.ts';
import type { TasteBrowser, TastePage } from './taste.ts';

// What the command does inside the inspector's Chrome: the one login before
// the first tab, and the made-up shop's answers in every tab.

// The command stops with this when it cannot start the inspector: nothing
// was inspected, and nothing was written.
export class CannotInspect extends Error {}

// A request the DevTools protocol's Fetch domain has paused.
interface PausedRequest {
  requestId: string;
  request: { url: string; method: string; headers: Record<string, string> };
}

// A header of a paused request. The protocol gives the names as the page set
// them, and `fetch` writes them in lower case.
function header(request: PausedRequest['request'], name: string): string | undefined {
  const wanted = name.toLowerCase();
  return Object.entries(request.headers).find(([key]) => key.toLowerCase() === wanted)?.[1];
}

// Waits until an expression is true in the page, at most `timeoutMs`. A page
// on its way to another address cannot be asked, and counts as not yet. It
// asks at least once.
async function until(
  page: TastePage,
  expression: string,
  timeoutMs: number,
): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    if ((await page.eval(`Boolean(${expression})`).catch(() => false)) === true)
      return true;
    if (Date.now() >= end) return false;
    await sleep(100);
  }
}

export interface Login {
  name: string;
  password: string;
}

// Logs in to the dashboard in a tab of its own, the way a person does at
// Keycloak's login screen, so that Keycloak's cookie is in the profile every
// later tab shares. It finishes once the dashboard is back and drawn, and
// gives the Authorization header the dashboard's first call to the API
// carried. When the login does not land back on the dashboard it fails, and
// says what the page is instead. Neither the name nor the password is ever
// printed.
export async function logIn(
  browser: TasteBrowser,
  dashboardUrl: string,
  apiUrl: string,
  login: Login,
  language: string | undefined,
): Promise<string> {
  const page = await browser.newPage({ width: 1440, height: 900 });
  try {
    let authorization: string | undefined;
    browser.on(page.sessionId, 'Fetch.requestPaused', (paused: PausedRequest) => {
      authorization ??= header(paused.request, 'Authorization');
      void page
        .send('Fetch.continueRequest', { requestId: paused.requestId })
        .catch(() => {});
    });
    await page.send('Fetch.enable', {
      patterns: [{ urlPattern: `${apiUrl}/*`, requestStage: 'Request' }],
    });

    const dashboard = new URL(dashboardUrl).origin;
    await page.goto(dashboardUrl, { timeoutMs: 30000, settleMs: 0 });
    if (!(await until(page, `document.querySelector('#kc-form-login')`, 15000))) {
      throw new CannotInspect(
        `Keycloak's login screen did not show after opening ${dashboardUrl}; the page is at ${await where(page)}.`,
      );
    }

    await page.eval(`(() => {
      const login = ${JSON.stringify(login)};
      document.querySelector('#username').value = login.name;
      document.querySelector('#password').value = login.password;
      document.querySelector('#kc-login').click();
    })()`);

    const back = await until(
      page,
      `location.origin === ${JSON.stringify(dashboard)} && document.getElementById('root')?.childElementCount > 0`,
      20000,
    );
    if (!back) {
      const said = await page
        .eval(
          `document.querySelector('#input-error, .kc-feedback-text, .alert-error')?.textContent?.trim() ?? ''`,
        )
        .catch(() => '');
      const onKeycloak = await until(page, `document.querySelector('#kc-form-login')`, 0);
      throw new CannotInspect(
        onKeycloak
          ? `After the login the page is still Keycloak's login screen, at ${await where(page)}${said ? `, which says "${String(said)}"` : ''}. The login did not land back on the dashboard, so nothing was inspected and no findings were written.`
          : `After the login the page is at ${await where(page)}, not back on the dashboard at ${dashboard}. Nothing was inspected and no findings were written.`,
      );
    }

    if (language !== undefined) {
      // The Vendor portal's language is the one chosen with its switch in
      // this browser, which it keeps in the browser's storage (ADR-0008).
      await page.eval(`localStorage.setItem('language', ${JSON.stringify(language)})`);
    }

    // The dashboard asks the API who the caller is as soon as it is drawn.
    for (let waited = 0; authorization === undefined && waited < 15000; waited += 100) {
      await sleep(100);
    }
    if (authorization === undefined) {
      throw new CannotInspect(
        'The dashboard made no call to the API after the login, so the catalog could not be read for the made-up shop.',
      );
    }
    return authorization;
  } finally {
    await page.close();
  }
}

// Where the page is, without its query or fragment, which may hold a code
// of the login.
async function where(page: TastePage): Promise<string> {
  const address = await page.eval('location.origin + location.pathname').catch(() => '');
  return String(address) || 'an address the page would not give';
}

// The paths of the API the made-up shop answers for: every call about
// Vendors and Offers.
const theShopsPaths = ['/v1/vendors*', '/v1/offers*', '/v1/caller/vendor*'];

// Answers every call about Vendors and Offers in a tab from the made-up shop,
// before it leaves the browser, so that nothing is written to the
// development database: only the calls that read the real Vendors reach the
// API, and the list of them is answered with the shop's Vendor among them. The API is on another address than
// the dashboard, so each answer carries what the browser asks of a
// cross-origin answer, and a preflight is answered too.
export async function answerFromTheShopIn(
  browser: TasteBrowser,
  page: TastePage,
  shop: MadeUpShop,
  apiUrl: string,
): Promise<void> {
  browser.on(
    page.sessionId,
    'Fetch.requestPaused',
    ({ requestId, request }: PausedRequest) => {
      const address = new URL(request.url);
      const crossOrigin = [
        { name: 'Access-Control-Allow-Origin', value: header(request, 'Origin') ?? '*' },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Vary', value: 'Origin' },
      ];
      if (request.method === 'OPTIONS') {
        void page
          .send('Fetch.fulfillRequest', {
            requestId,
            responseCode: 204,
            responseHeaders: [
              ...crossOrigin,
              { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
              {
                name: 'Access-Control-Allow-Headers',
                value: header(request, 'Access-Control-Request-Headers') ?? 'authorization',
              },
            ],
          })
          .catch(() => {});
        return;
      }

      const call = { method: request.method, path: address.pathname + address.search };
      const fulfil = (answer: ShopAnswer) =>
        page
          .send('Fetch.fulfillRequest', {
            requestId,
            responseCode: answer.status,
            responseHeaders: [
              ...crossOrigin,
              { name: 'Content-Type', value: 'application/json' },
            ],
            body: Buffer.from(JSON.stringify(answer.body)).toString('base64'),
          })
          .catch(() => {});

      // The list of Vendors: the API's own page, read here with the tab's
      // Authorization, and the shop's Vendor put among them.
      if (listsTheVendors(call)) {
        const authorization = header(request, 'Authorization');
        void fetch(request.url, {
          headers: authorization === undefined ? {} : { Authorization: authorization },
        })
          .then(async (response) => ({
            status: response.status,
            body: (await response.json()) as unknown,
          }))
          .then((api) => fulfil(vendorsWithTheShops(shop, api)))
          .catch(() => page.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }))
          .catch(() => {});
        return;
      }

      const answer = answerFromTheMadeUpShop(shop, new Date(), call);
      if (answer === undefined) {
        void page.send('Fetch.continueRequest', { requestId }).catch(() => {});
        return;
      }
      void fulfil(answer);
    },
  );
  await page.send('Fetch.enable', {
    patterns: theShopsPaths.map((path) => ({
      urlPattern: `${apiUrl}${path}`,
      requestStage: 'Request',
    })),
  });
}
