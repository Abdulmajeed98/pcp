import { BadScheme, type Scheme, takeTheScheme } from './colour-scheme.ts';

// The command line of `pnpm shopper:inspect`: a page's path on the Shopper
// app, without its language, `--language` for the language its address
// starts with, `--scheme` for the colour scheme, and the inspector's own
// options, passed through as they are.

// A line the command cannot read.
export class BadCommandLine extends Error {}

// The Shopper app's languages, the first of which is its own fallback, as
// `@pcp/i18n` lists them; the command runs in Node, which reads no library's
// TypeScript, so they are written here.
const languages = ['ckb', 'ar', 'en'] as const;

export function shopperCommandLine(
  args: readonly string[],
  origin: string,
): { address: string; scheme: Scheme | undefined; inspectorArgs: string[] } {
  let scheme: Scheme | undefined;
  let rest: string[];
  try {
    ({ scheme, rest } = takeTheScheme(args));
  } catch (error) {
    if (error instanceof BadScheme) throw new BadCommandLine(error.message);
    throw error;
  }

  let language: string = languages[0];
  const at = rest.indexOf('--language');
  if (at !== -1) {
    const [, given] = rest.splice(at, 2);
    if (!languages.some((each) => each === given)) {
      throw new BadCommandLine('--language takes ckb, ar or en.');
    }
    language = given;
  }

  const [path, ...options] = rest;
  if (path === undefined || !path.startsWith('/')) {
    throw new BadCommandLine("The page's path comes first, starting with /.");
  }
  const page = new URL(path, origin);
  const [first] = page.pathname.split('/').filter(Boolean);
  if (languages.some((each) => each === first)) {
    throw new BadCommandLine('The path leaves out the language, which --language gives.');
  }
  const address = `${origin}/${language}${page.pathname === '/' ? '' : page.pathname}${page.search}`;
  return { address, scheme, inspectorArgs: [address, ...options] };
}
