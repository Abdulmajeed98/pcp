import type { PartPageResponse } from '@pcp/api-client';

import { askedAgainIfItDrops } from './asked-again.ts';
import { partsOfTheCatalog } from './catalog-parts.ts';
import {
  answerFromTheShopIn,
  CannotInspect,
  landOnTheDashboard,
  type Login,
  logIn,
} from './chrome.ts';
import { BadScheme, emulatedMedia, type Scheme, takeTheScheme } from './colour-scheme.ts';
import { developmentAdmin } from './development-admin.ts';
import { madeUpShop } from './made-up-shop.ts';
import { runTheInspector, tastesBrowser } from './taste.ts';
import { ignoreARefusedTypeOfService } from './type-of-service.ts';

// Runs Taste's inspector on a screen of the dashboard as the development
// Admin sees it, with the calls about Vendors and Offers answered from a
// made-up shop, whose Vendor is listed among the real ones. Run it from the
// repository root:
//
//   pnpm dashboard:inspect <dashboard address> [--language ckb|ar|en] [--scheme light|dark] [--no-platform-rate] [the inspector's options]
//
// It launches the inspector's Chrome, logs in once as the development Admin
// before the first tab, so that Keycloak's cookie carries to every width,
// reads the shop's Parts from the catalog, and then runs Taste's
// `inspect.mjs` unchanged, with every option but `--language` and `--scheme`
// passed through (`--widths`, `--out`, `--app` and the rest). `--scheme` shows
// every tab in the light or the dark scheme; without it Chrome follows the
// computer's appearance. The shop holds a Platform Rate, and
// `--no-platform-rate` shows the Platform Rate screen as it is before the
// Admin sets the first. The Vendor portal's screens are the Admin acting as
// the shop's Vendor, under `/vendors/00000000-0000-4000-8000-000000000001/portal`.
//
// It exits with the inspector's own status, 0 with no FAIL findings and 1
// with some, or with 3, before any finding is written, when it cannot
// start or cannot go on: when the login does not land back on the
// dashboard, above all, or when a tab is left on Keycloak's login screen
// though the screen was opened twice.

const usage =
  'usage: pnpm dashboard:inspect <dashboard address> [--language ckb|ar|en] [--scheme light|dark] [--no-platform-rate] [--widths 1440,768,390] [--out DIR] [--app] [other options of inspect.mjs]';

// Before any read: a refused type of service would stop the command where
// nothing can catch it (`type-of-service.ts`).
ignoreARefusedTypeOfService();

// Where the API is during development, as the dashboard's settings have it.
const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3001';

const cannotStart = 3;

function stop(message: string): never {
  console.error(message);
  process.exit(cannotStart);
}

function commandLine(args: readonly string[]) {
  let scheme: Scheme | undefined;
  let passed: string[];
  try {
    ({ scheme, rest: passed } = takeTheScheme(args));
  } catch (error) {
    if (error instanceof BadScheme) stop(usage);
    throw error;
  }
  let language: string | undefined;
  const at = passed.indexOf('--language');
  if (at !== -1) {
    language = passed[at + 1];
    passed.splice(at, 2);
    if (language === undefined || !['ckb', 'ar', 'en'].includes(language)) stop(usage);
  }
  const withoutARate = passed.indexOf('--no-platform-rate');
  const platformRate = withoutARate === -1;
  if (!platformRate) passed.splice(withoutARate, 1);
  const address = passed[0];
  if (address === undefined || !/^https?:\/\//.test(address)) stop(usage);
  return { address, language, scheme, platformRate, inspectorArgs: passed };
}

const { address, language, scheme, platformRate, inspectorArgs } = commandLine(
  process.argv.slice(2),
);
let login: Login;
try {
  login = developmentAdmin();
} catch (error) {
  stop(error instanceof Error ? error.message : String(error));
}
const Browser = await tastesBrowser();
const browser = await Browser.launch();

try {
  const authorization = await logIn(browser, address, apiUrl, login, language);
  const parts = await partsOfTheCatalog(async ({ category, search }) => {
    const query = new URLSearchParams({ category, search, page: '0', size: '50' });
    // Asked again when its connection drops, as the Shopper's reading is.
    const response = await askedAgainIfItDrops(() =>
      fetch(`${apiUrl}/v1/parts?${query}`, { headers: { Authorization: authorization } }),
    );
    if (!response.ok) {
      throw new CannotInspect(
        `The API answered ${response.status} to a search of the catalog.`,
      );
    }
    return ((await response.json()) as PartPageResponse).content;
  });
  const shop = madeUpShop(new Date(), parts, { platformRate });

  // Every tab the inspector opens is answered from the shop, and lands on
  // the dashboard, drawn, before it is judged; the inspector's own launch
  // gives it this Chrome, logged in.
  const newPage = browser.newPage.bind(browser);
  const dashboard = new URL(address).origin;
  browser.newPage = async (options) => {
    const page = await newPage(options);
    await answerFromTheShopIn(browser, page, shop, apiUrl);
    landOnTheDashboard(page, dashboard);
    await page.send('Emulation.setEmulatedMedia', emulatedMedia(scheme, options ?? {}));
    return page;
  };
  Browser.launch = async () => browser;

  console.log(
    `Logged in as the development Admin. The made-up shop "${shop.vendor.name}" answers for Vendors and Offers, with ${shop.offers.length} Offers of real Parts.`,
  );
} catch (error) {
  await browser.close();
  stop(error instanceof Error ? error.message : String(error));
}

try {
  await runTheInspector(inspectorArgs);
} catch (error) {
  // A tab that did not land on the dashboard stops the inspection before
  // the inspector writes any finding.
  if (error instanceof CannotInspect) stop(error.message);
  throw error;
}
