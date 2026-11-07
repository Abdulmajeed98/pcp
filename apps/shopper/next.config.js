//@ts-check
const { join, relative } = require('node:path');

const createNextIntlPlugin = require('next-intl/plugin');

// next-intl reads the language and the text of each request from this file.
// Its plugin takes a path from the working directory and looks for the file
// there. Next works in this folder, but Nx reads this configuration from the
// repository root, where a path from this folder names nothing. With
// NODE_ENV set to "development", next-intl then throws, and no Nx command
// runs at all. So the path is written from wherever this is read.
const requestSetUp = join(__dirname, 'src/shared/i18n/request.ts');
const withNextIntl = createNextIntlPlugin(`./${relative(process.cwd(), requestSetUp)}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // When an AI coding agent starts the development server, Next writes an
  // `AGENTS.md` into this folder. This repository keeps its instructions for
  // agents in `CLAUDE.md` and `docs/agents`, so that is switched off.
  agentRules: false,
  // An address that matches no route is answered with `app/global-not-found`,
  // which Next draws on the server, rather than a bare document the browser
  // draws the "not found" screen from (follow-up ticket 07). Next 16.4
  // documents it as experimental.
  experimental: { globalNotFound: true },
  ...forTheInspection(process.env.SHOPPER_INSPECTION_DIST_DIR),
};

// `pnpm shopper:inspect` starts a Shopper app of its own beside the owner's,
// pointed at its stand-in API (`apps/inspector`). Next lets one development
// server work in a folder's files at a time, so the inspection names a folder
// of its own, which Git ignores, and hides Next's development indicator,
// which no Shopper ever sees and the inspector would judge. Nothing else
// sets it, so every other run is as before.
/** @param {string | undefined} folder */
function forTheInspection(folder) {
  return folder === undefined ? {} : { distDir: folder, devIndicators: false };
}

module.exports = withNextIntl(nextConfig);
