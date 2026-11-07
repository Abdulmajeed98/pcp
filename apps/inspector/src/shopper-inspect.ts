import type { CategoryResponse, PartPageResponse, PartResponse } from '@pcp/api-client';

import { tokenOfTheDevelopmentAdmin } from './admin-token.ts';
import { askedAgainIfItDrops } from './asked-again.ts';
import { type CatalogReads, readTheShoppersCatalog } from './catalog-parts.ts';
import { CannotInspect, type Login } from './chrome.ts';
import { emulatedMedia } from './colour-scheme.ts';
import { developmentAdmin } from './development-admin.ts';
import { madeUpPhotos } from './made-up-photos.ts';
import {
  isTaken,
  shoppersOwnFiles,
  startTheShopperApp,
  untilItAnswers,
  type ShopperApp,
} from './shopper-app.ts';
import { BadCommandLine, shopperCommandLine } from './shopper-command-line.ts';
import { type StandIn, startTheStandIn } from './stand-in-server.ts';
import { runTheInspector, tastesBrowser } from './taste.ts';
import { theShoppersShop } from './the-shoppers-shop.ts';
import { ignoreARefusedTypeOfService } from './type-of-service.ts';

// Runs Taste's inspector on a page of the Shopper app, filled from the
// made-up shop rather than the development database. Run it from the
// repository root:
//
//   pnpm shopper:inspect <path> [--language ckb|ar|en] [--scheme light|dark] [the inspector's options]
//
// The Shopper app calls the API on its server, where the inspector's Chrome
// cannot answer for it as `pnpm dashboard:inspect` answers for the
// dashboard. So the command logs in to Keycloak once as the development
// Admin, reads the made-up shop's real Parts from the catalog, and starts a
// stand-in API on port 3101 that answers the public endpoints the Shopper app
// reads from the shop (`stand-in-api.ts`), refusing every other request and
// saying so. It starts a Shopper app of its own on port 3100 with `API_URL`
// set to the stand-in, leaving the owner's on port 3000 alone, and runs
// Taste's `inspect.mjs` unchanged on the page, with every option but
// `--language` and `--scheme` passed through (`--widths`, `--out`, `--app`
// and the rest). The path leaves out the language: `--language` gives it,
// Kurdish when left out. `--scheme` shows every tab in the light or the dark
// scheme; without it Chrome follows the computer's appearance. Both servers
// are stopped when it ends, however it ends.
//
// It exits with the inspector's own status, 0 with no FAIL findings and 1
// with some, or with 3, before any finding is written, when it cannot start:
// a port it needs taken, the API, Keycloak or the catalog missing, or the
// Shopper app not answering.

const usage =
  'usage: pnpm shopper:inspect <path without the language> [--language ckb|ar|en] [--scheme light|dark] [--widths 1440,768,390] [--out DIR] [other options of inspect.mjs]';

// Before any read: a refused type of service would stop the command where
// nothing can catch it (`type-of-service.ts`).
ignoreARefusedTypeOfService();

const shopperPort = 3100;
const standInPort = 3101;
const shopperOrigin = `http://localhost:${shopperPort}`;

// Where the API and Keycloak are during development, as the Shopper app's
// and the dashboard's settings have them.
const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
const keycloak = {
  url: process.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: process.env.VITE_KEYCLOAK_REALM ?? 'pcp',
  clientId: process.env.VITE_KEYCLOAK_CLIENT_ID ?? 'dashboard',
  redirectUri: 'http://localhost:3002/',
};

const cannotStart = 3;

// What the command started, which it stops, and nothing else.
let standIn: StandIn | undefined;
let shopper: ShopperApp | undefined;

function stopWhatItStarted() {
  shopper?.stop();
  void standIn?.close();
}

process.on('exit', stopWhatItStarted);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  process.on(signal, () => {
    stopWhatItStarted();
    process.exit(130);
  });
}

function stop(message: string): never {
  console.error(message);
  process.exit(cannotStart);
}

async function answers(address: string): Promise<boolean> {
  return fetch(address)
    .then((response) => response.ok)
    .catch(() => false);
}

// A read of the API over HTTP with the login's token, asked again when its
// connection drops (`asked-again.ts`): the made-up shop's reading asks
// hundreds of them.
function readOfTheApi(path: string, authorization: string): Promise<Response> {
  return askedAgainIfItDrops(() =>
    fetch(`${apiUrl}${path}`, { headers: { Authorization: authorization } }),
  );
}

// The Admin's reads of the catalog, over HTTP, with the login's token.
function catalogOfTheApi(authorization: string): CatalogReads {
  const read = async <Body>(path: string, what: string): Promise<Body> => {
    const response = await readOfTheApi(path, authorization);
    if (!response.ok) {
      throw new CannotInspect(
        `The API answered ${response.status} to ${what}${response.status >= 500 ? '. Are the services running ("pnpm services:up")?' : '.'}`,
      );
    }
    return (await response.json()) as Body;
  };
  return {
    search: ({ category, search = '', page, size }) =>
      read<PartPageResponse>(
        `/v1/parts?${new URLSearchParams({ category, search, page: String(page), size: String(size) })}`,
        'a search of the catalog',
      ),
    part: (partId) =>
      read<PartResponse>(`/v1/parts/${partId}`, "a read of a Part's specifications"),
    categories: () =>
      read<CategoryResponse[]>('/v1/categories', 'a read of the Categories'),
  };
}

let address: string;
let scheme: ReturnType<typeof shopperCommandLine>['scheme'];
let inspectorArgs: string[];
try {
  ({ address, scheme, inspectorArgs } = shopperCommandLine(
    process.argv.slice(2),
    shopperOrigin,
  ));
} catch (error) {
  if (error instanceof BadCommandLine) stop(`${error.message}\n${usage}`);
  throw error;
}

for (const [port, what] of [
  [shopperPort, "the inspection's own Shopper app"],
  [standInPort, 'the stand-in API'],
] as const) {
  if (await isTaken(port)) {
    stop(
      `Port ${port}, which ${what} takes, is in use. Stop what listens there, or let the inspection that holds it finish. Nothing was started.`,
    );
  }
}

let login: Login;
try {
  login = developmentAdmin();
} catch (error) {
  stop(error instanceof Error ? error.message : String(error));
}
if (!(await answers(`${apiUrl}/v1/status`))) {
  stop(
    `The API does not answer at ${apiUrl}. Start it with "pnpm exec nx serve @pcp/api", with the services running ("pnpm services:up"); the made-up shop reads its Parts from the catalog through it.`,
  );
}
if (
  !(await answers(
    `${keycloak.url}/realms/${keycloak.realm}/.well-known/openid-configuration`,
  ))
) {
  stop(
    `Keycloak does not answer at ${keycloak.url}. Start the services with "pnpm services:up".`,
  );
}

const Browser = await tastesBrowser();
const browser = await Browser.launch();
try {
  const authorization = await tokenOfTheDevelopmentAdmin(browser, keycloak, login);
  const catalog = await readTheShoppersCatalog(catalogOfTheApi(authorization));
  const shop = theShoppersShop(new Date(), catalog, await madeUpPhotos());

  standIn = await startTheStandIn(shop, standInPort, (line) => console.log(line));
  shopper = startTheShopperApp({ port: shopperPort, apiUrl: standIn.url });
  if (!(await untilItAnswers(shopper, address, 180_000))) {
    throw new CannotInspect(
      `The inspection's Shopper app did not answer ${address}. Its last lines, in apps/shopper/${shoppersOwnFiles}/next-dev.log:\n${shopper.lastLines()}`,
    );
  }

  // The inspector's own launch gives it this Chrome, and every tab it opens
  // is shown in the scheme asked for, with the motion Taste asks for.
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (options) => {
    const page = await newPage(options);
    await page.send('Emulation.setEmulatedMedia', emulatedMedia(scheme, options ?? {}));
    return page;
  };
  Browser.launch = async () => browser;

  console.log(
    `The stand-in API answers at ${standIn.url} from the made-up shop: ${shop.vendors.length} Vendors and ${shop.offers.length} Offers of ${shop.parts.size} real Parts. The inspection's Shopper app answers at ${shopperOrigin}.`,
  );
} catch (error) {
  await browser.close();
  stop(error instanceof Error ? error.message : String(error));
}

await runTheInspector(inspectorArgs);
