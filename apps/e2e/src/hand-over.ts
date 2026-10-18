import type { Locator, Page } from '@playwright/test';

import type { Language } from './languages';

// The temporary password and the hand-over, which the Admin console shows
// after a create and after a reset of a Vendor's password. The Admin console
// is in English, so they are found by their English names.

// The temporary password, shown once.
export function temporaryPassword(page: Page): Locator {
  return page.getByTestId('temporary-password');
}

// The hand-over's choice of the message's language.
export function messageLanguage(page: Page): Locator {
  return page.getByRole('group', { name: 'Language of the message' });
}

// The hand-over's link, and the message it writes, in the language chosen:
// where the link goes, and the message's lines.
export async function theHandOver(
  page: Page,
  language: Language,
): Promise<{ chat: string; lines: string[] }> {
  await messageLanguage(page).getByRole('radio', { name: language.ownName }).check();
  const link = page.getByRole('link', { name: /WhatsApp/ });
  const address = new URL((await link.getAttribute('href')) ?? '');
  return {
    chat: `${address.origin}${address.pathname}`,
    lines: (address.searchParams.get('text') ?? '').split('\n'),
  };
}

// The values of the message's lines, each what follows its label's colon
// and the space after it, in any language. A right-to-left message puts a
// left-to-right mark between that space and a number, which is not part of
// the value.
export function valuesOf(lines: string[]): string[] {
  return lines.flatMap((line) => /^[^:]+: ‎?(.+)$/.exec(line)?.[1] ?? []);
}

// What the message gives a Vendor to log in with: its login phone number, in
// Iraq's own form, and its temporary password, twelve letters and digits.
// Either is empty when the message gives none.
export function loginOfTheMessage(lines: string[]): { name: string; password: string } {
  const values = valuesOf(lines);
  return {
    name: values.find((value) => /^0\d{3} \d{3} \d{4}$/.test(value)) ?? '',
    password: values.find((value) => /^[a-z0-9]{12}$/.test(value)) ?? '',
  };
}
