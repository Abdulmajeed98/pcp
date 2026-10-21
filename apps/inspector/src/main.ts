import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import type { PartPageResponse } from '@pcp/api-client';

import { partsOfTheCatalog } from './catalog-parts.ts';
import { answerFromTheShopIn, CannotInspect, logIn } from './chrome.ts';
import { madeUpShop } from './made-up-shop.ts';
import { runTheInspector, tastesBrowser } from './taste.ts';

// Runs Taste's inspector on a screen of the dashboard as the development
// Admin sees it, with the calls about Vendors and Offers answered from a
// made-up shop. Run it from the repository root:
//
//   pnpm dashboard:inspect <dashboard address> [--language ckb|ar|en] [the inspector's options]
//
// It launches the inspector's Chrome, logs in once as the development Admin
// before the first tab, so that Keycloak's cookie carries to every width,
// reads the shop's Parts from the catalog, and then runs Taste's
// `inspect.mjs` unchanged, with every option but `--language` passed through
// (`--widths`, `--out`, `--app` and the rest). The Vendor portal's screens
// are the Admin acting as the shop's Vendor, under
// `/vendors/00000000-0000-4000-8000-000000000001/portal`.
//
// It exits with the inspector's own status, 0 with no FAIL findings and 1
// with some, or with 3, before anything is inspected or written, when it
// cannot start: when the login does not land back on the dashboard, above
// all.

const usage =
  'usage: pnpm dashboard:inspect <dashboard address> [--language ckb|ar|en] [--widths 1440,768,360] [--out DIR] [--app] [other options of inspect.mjs]';

// Where the API is during development, as the dashboard's settings have it.
const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3001';

const repositoryRoot = new URL('../../../', import.meta.url);

const cannotStart = 3;

function stop(message: string): never {
  console.error(message);
  process.exit(cannotStart);
}

function commandLine(args: readonly string[]) {
  const passed = [...args];
  let language: string | undefined;
  const at = passed.indexOf('--language');
  if (at !== -1) {
    language = passed[at + 1];
    passed.splice(at, 2);
    if (language === undefined || !['ckb', 'ar', 'en'].includes(language)) stop(usage);
  }
  const address = passed[0];
  if (address === undefined || !/^https?:\/\//.test(address)) stop(usage);
  return { address, language, inspectorArgs: passed };
}

// The development Admin's name and password, from `.env`, as
// `pnpm services:up` wrote them. Neither is ever printed.
function developmentAdmin() {
  let settings: Record<string, string | undefined>;
  try {
    settings = parseEnv(readFileSync(new URL('.env', repositoryRoot), 'utf8'));
  } catch {
    stop(
      'There is no .env at the repository root. Start the services with "pnpm services:up".',
    );
  }
  const name = settings.DEVELOPMENT_ADMIN_NAME;
  const password = settings.DEVELOPMENT_ADMIN_PASSWORD;
  if (!name || !password) {
    stop(".env does not hold the development Admin's name and password.");
  }
  return { name, password };
}

const { address, language, inspectorArgs } = commandLine(process.argv.slice(2));
const login = developmentAdmin();
const Browser = await tastesBrowser();
const browser = await Browser.launch();

try {
  const authorization = await logIn(browser, address, apiUrl, login, language);
  const parts = await partsOfTheCatalog(async ({ category, search }) => {
    const query = new URLSearchParams({ category, search, page: '0', size: '50' });
    const response = await fetch(`${apiUrl}/v1/parts?${query}`, {
      headers: { Authorization: authorization },
    });
    if (!response.ok) {
      throw new CannotInspect(
        `The API answered ${response.status} to a search of the catalog.`,
      );
    }
    return ((await response.json()) as PartPageResponse).content;
  });
  const shop = madeUpShop(new Date(), parts);

  // Every tab the inspector opens is answered from the shop, and the
  // inspector's own launch gives it this Chrome, logged in.
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (options) => {
    const page = await newPage(options);
    await answerFromTheShopIn(browser, page, shop, apiUrl);
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

await runTheInspector(inspectorArgs);
