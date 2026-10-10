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
};

module.exports = withNextIntl(nextConfig);
