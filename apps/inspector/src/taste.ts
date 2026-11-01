import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// What this command uses of Taste's inspector (the `design-taste-frontend`
// skill), whose files are never edited here, so that `npx skills update -g`
// cannot undo the command. Taste's `scripts/lib/cdp.mjs` drives Chrome over
// the DevTools protocol; these are the parts of its `Browser` and `Page` the
// command calls, typed here because Taste ships no types.

export interface PageOptions {
  width?: number;
  height?: number;
  dsf?: number;
  mobile?: boolean;
  reducedMotion?: boolean;
}

export interface TastePage {
  readonly sessionId: string;
  goto(url: string, options?: { timeoutMs?: number; settleMs?: number }): Promise<string>;
  // Evaluates an expression in the page and gives its value.
  eval(expression: string): Promise<unknown>;
  // Sends one command of the DevTools protocol for this page.
  send(method: string, params?: object): Promise<unknown>;
  close(): Promise<void>;
}

export interface TasteBrowser {
  newPage(options?: PageOptions): Promise<TastePage>;
  // Listens to one event of the DevTools protocol, for one page.
  on(sessionId: string, method: string, listener: (params: never) => void): () => void;
  close(): Promise<void>;
}

export interface TasteBrowserClass {
  launch(options?: {
    width?: number;
    height?: number;
    extraArgs?: string[];
  }): Promise<TasteBrowser>;
}

// Where Taste is installed: at user level, as docs/agents/design-skills.md
// says, unless TASTE_SKILL_DIR names another folder.
export function tasteSkillFolder(): string {
  return (
    process.env.TASTE_SKILL_DIR ??
    join(homedir(), '.claude', 'skills', 'design-taste-frontend')
  );
}

export function inspectorScript(): string {
  return join(tasteSkillFolder(), 'scripts', 'inspect.mjs');
}

// Taste's `Browser`, the very class the inspector imports, since a module is
// loaded once for each address.
export async function tastesBrowser(): Promise<TasteBrowserClass> {
  const library = join(tasteSkillFolder(), 'scripts', 'lib', 'cdp.mjs');
  if (!existsSync(library)) {
    throw new Error(
      `Taste's inspector is not at ${library}. Install the design-taste-frontend skill, or set TASTE_SKILL_DIR to its folder.`,
    );
  }
  const { Browser } = (await import(pathToFileURL(library).href)) as {
    Browser: TasteBrowserClass;
  };
  return Browser;
}

// Runs Taste's inspector, unchanged, in this process, with `args` as its
// command line. It exits the process itself when it is done, with its own
// exit status: 0 with no FAIL findings, 1 with at least one.
export async function runTheInspector(args: readonly string[]): Promise<void> {
  const script = inspectorScript();
  process.argv = [process.argv[0], script, ...args];
  await import(pathToFileURL(script).href);
}
