import type { Currency } from '@pcp/api-client';

import { BadScheme, type Scheme, takeTheScheme } from './colour-scheme.ts';
import { currencies } from './currencies.ts';

// The command line of `pnpm shopper:inspect`: a page's path on the Shopper
// app, without its language, `--language` for the language its address
// starts with, `--scheme` for the colour scheme, `--currency` for the
// currency its prices show in, and the inspector's own options, passed
// through as they are.

// A line the command cannot read.
export class BadCommandLine extends Error {}

// The Shopper app's languages, the first of which is its own fallback, as
// `@pcp/i18n` lists them; the command runs in Node, which reads no library's
// TypeScript, so they are written here.
const languages = ['ckb', 'ar', 'en'] as const;

// Takes an option and the value after it off the command line, when it is
// there: one of the values it may take, or else the line is refused.
function takeAChoice<Choice extends string>(
  rest: string[],
  option: string,
  choices: readonly Choice[],
  refusal: string,
): Choice | undefined {
  const at = rest.indexOf(option);
  if (at === -1) return undefined;
  const [, given] = rest.splice(at, 2);
  const chosen = choices.find((each) => each === given);
  if (chosen === undefined) throw new BadCommandLine(refusal);
  return chosen;
}

export function shopperCommandLine(
  args: readonly string[],
  origin: string,
): {
  address: string;
  scheme: Scheme | undefined;
  currency: Currency | undefined;
  inspectorArgs: string[];
} {
  let scheme: Scheme | undefined;
  let rest: string[];
  try {
    ({ scheme, rest } = takeTheScheme(args));
  } catch (error) {
    if (error instanceof BadScheme) throw new BadCommandLine(error.message);
    throw error;
  }

  const currency = takeAChoice(
    rest,
    '--currency',
    currencies,
    '--currency takes IQD or USD.',
  );
  const language =
    takeAChoice(rest, '--language', languages, '--language takes ckb, ar or en.') ??
    languages[0];

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
  return { address, scheme, currency, inspectorArgs: [address, ...options] };
}
