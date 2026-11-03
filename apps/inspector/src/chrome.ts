import { setTimeout as sleep } from 'node:timers/promises';

import {
  answerFromTheMadeUpShop,
  catalogSearchOfTheShop,
  listsTheVendors,
  type MadeUpShop,
  type ShopAnswer,
  partsWithTheShopsOffers,
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
export async function until(
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
      // Only reads, and their preflights, reach the API from this tab too.
      const reads = ['GET', 'OPTIONS'].includes(paused.request.method);
      void page
        .send(
          reads ? 'Fetch.continueRequest' : 'Fetch.failRequest',
          reads
            ? { requestId: paused.requestId }
            : { requestId: paused.requestId, errorReason: 'BlockedByClient' },
        )
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

// Where a tab is, once an address has been opened in it: on which origin,
// whether Keycloak's login screen is drawn, and whether the dashboard is.
export interface Landing {
  origin: string;
  loginScreen: boolean;
  drawn: boolean;
}

const landing = `({
  origin: location.origin,
  loginScreen: document.querySelector('#kc-form-login') !== null,
  drawn: (document.getElementById('root')?.childElementCount ?? 0) > 0,
})`;

// Makes every screen of the dashboard the inspector opens in this tab land on
// the dashboard, drawn, before the inspector looks at it. Keycloak's cookie
// usually sends a new tab straight back, but a tab was seen left on
// Keycloak's login screen, which the inspector then judged as the screen
// (false FAILs for its heavy shadow). So after each open the tab is watched
// for up to `waitMs`; left on the login screen, or anywhere but the
// dashboard drawn, the screen is opened once more; and should it still not
// land, the inspection stops, loudly, rather than judge another page.
// Addresses that are not the dashboard's, such as the inspector's own
// contact sheet, are opened as the inspector asks.
export function landOnTheDashboard(
  page: TastePage,
  dashboardOrigin: string,
  { waitMs = 15000, pollMs = 100 } = {},
): void {
  const open = page.goto.bind(page);
  page.goto = async (url, options) => {
    if (new URL(url).origin !== dashboardOrigin) return open(url, options);
    let last: Landing | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const how = await open(url, options);
      const end = Date.now() + waitMs;
      for (;;) {
        last = (await page.eval(landing).catch(() => undefined)) as Landing | undefined;
        if (last?.origin === dashboardOrigin && last.drawn && !last.loginScreen) {
          return how;
        }
        if (Date.now() >= end) break;
        await sleep(pollMs);
      }
    }
    const shown = last?.loginScreen
      ? "Keycloak's login screen"
      : `a page at ${last?.origin ?? 'an address it would not give'} that is not the dashboard drawn`;
    throw new CannotInspect(
      `A tab of the inspector opened ${new URL(url).pathname} twice and was left on ${shown}, so the inspection stopped rather than judge it. Run the command again.`,
    );
  };
}

// Where the page is, without its query or fragment, which may hold a code
// of the login.
async function where(page: TastePage): Promise<string> {
  const address = await page.eval('location.origin + location.pathname').catch(() => '');
  return String(address) || 'an address the page would not give';
}

// Answers every call about Vendors and Offers in a tab from the made-up shop,
// marks a search of the catalog for the shop's Vendor with its Offers, and
// refuses every call to the API that is not a read, whatever it is about,
// before it leaves the browser, so that nothing is written to the
// development database: only reads reach the API, and the list of the real
// Vendors is answered with the shop's Vendor among them. Every call to the
// API is paused for it. The API is on another address than the dashboard,
// so each answer carries what the browser asks of a cross-origin answer, and
// a preflight is answered too.
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

      // A search of the catalog for the shop's Vendor: the API's own search,
      // read here with the tab's Authorization, without the Vendor, and the
      // Parts the shop offers marked with its Offers.
      const search = catalogSearchOfTheShop(shop, call);
      if (search !== undefined) {
        const authorization = header(request, 'Authorization');
        void fetch(`${apiUrl}${search}`, {
          headers: authorization === undefined ? {} : { Authorization: authorization },
        })
          .then(async (response) => ({
            status: response.status,
            body: (await response.json()) as unknown,
          }))
          .then((api) => fulfil(partsWithTheShopsOffers(shop, api)))
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
    patterns: [{ urlPattern: `${apiUrl}/*`, requestStage: 'Request' }],
  });
}
