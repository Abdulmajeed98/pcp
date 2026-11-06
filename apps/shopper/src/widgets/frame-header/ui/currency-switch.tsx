'use client';

import type { Language } from '@pcp/i18n';
import { usePathname, useSearchParams } from 'next/navigation';

import type { Currency } from '@/shared/currency';

import { choice } from './choice';

// The currency switch, the price's own control (DESIGN.md's The currency
// switch): a choice of dinars or dollars, in which every price is shown,
// named "Prices in" on the page from 48rem. Its choices are named as prices
// are, "Dinars" and "Dollars" from 48rem, and on a phone by the marks every
// price carries, IQD and $, which are the same in every language. The chosen
// one is marked as the current one.
//
// A choice is a button of a plain form, which asks the server to remember it.
// The server's answer writes the choice down, for a year, and returns the
// Shopper to the page they were on, with its query but for a price range, in
// its language. It works before any script has loaded, and Safari's seven
// days for what a page's script writes do not apply. The choice is not in the
// page's address: a link opens in the currency of whoever opens it.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown, as the language switch does, and its query. Every
// Shopper page is drawn for each request, since the frame reads the chosen
// currency from it, so the server knows the query too. The server renders it
// as well, so the form is in the page as it arrives. The "not found" screen
// is the exception, because the browser draws that whole screen by script.
//
// The server hands it the two choices, each with its name in the page's
// language, and which one is chosen. It reads no cookie itself. `testId`
// tells this switch apart from the same choice standing above a price that
// leads a page, the square plate's tabs, which take `look` to be drawn as
// tabs, and are not named a second time as the page's currency switch: the
// price they stand above names them.
export function CurrencySwitch({
  language,
  current,
  label,
  choices,
  testId = 'currency-switch',
  look = 'frame',
}: {
  language: Language;
  current: Currency;
  label: string;
  choices: { currency: Currency; name: string; mark: string }[];
  testId?: string;
  look?: 'frame' | 'tabs';
}) {
  // The first part of an address is the page's language, and the rest is the
  // page, with its query.
  const query = useSearchParams().toString();
  const page = `${usePathname().replace(/^\/[^/]+/, '')}${query === '' ? '' : `?${query}`}`;

  return (
    // The address of `app/[locale]/currency/route.ts`, which answers it.
    <form
      action={`/${language}/currency`}
      method="post"
      aria-label={look === 'frame' ? label : undefined}
      data-testid={testId}
      className="flex items-center"
    >
      <input type="hidden" name="page" value={page} />
      {look === 'frame' && (
        <span
          aria-hidden="true"
          className="hidden pe-1 text-sm text-muted-foreground md:inline"
        >
          {label}
        </span>
      )}
      <ul className={look === 'tabs' ? 'flex gap-2' : 'flex'}>
        {choices.map(({ currency, name, mark }) => (
          <li key={currency}>
            <button
              type="submit"
              name="currency"
              value={currency}
              aria-current={currency === current ? 'true' : undefined}
              data-chosen={currency === current ? '' : undefined}
              className={
                look === 'tabs'
                  ? 'pressable no-callout inline-flex min-h-control cursor-pointer items-center px-1 text-lg text-muted-foreground decoration-3 underline-offset-8 hover:underline hover:decoration-1 data-chosen:font-semibold data-chosen:text-foreground data-chosen:underline data-chosen:decoration-3'
                  : `${choice} no-callout`
              }
            >
              {look === 'tabs' ? (
                name
              ) : (
                <>
                  <span className="hidden md:inline">{name}</span>
                  <span className="md:hidden">{mark}</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
