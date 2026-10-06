// Runs before every install and refuses any package manager other than pnpm.
// npm is already refused by `devEngines.packageManager` in package.json; this
// also stops yarn, which ignores that field unless it is run through Corepack.
const agent = process.env.npm_config_user_agent ?? '';

if (!agent.startsWith('pnpm/')) {
  console.error('This repository is installed with pnpm. Run "pnpm install" instead.');
  process.exit(1);
}
