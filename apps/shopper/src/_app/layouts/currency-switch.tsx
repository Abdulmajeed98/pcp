'use client';

import type { Language } from '@pcp/i18n';
import { usePathname, useSearchParams } from 'next/navigation';

import type { Currency } from '@/shared/currency';

// The currency switch: a choice of dinars or dollars, in which every price is
// shown. It sits beside the language switch and is drawn as that is: each
// choice is named in the page's language, the chosen one is marked as the
// current one and is bold where the other is underlined, and each is at least
// 44 pixels each way.
//
// A choice is a button of a plain form, which asks the server to remember it.
// The server's answer writes the choice down, for a year, and returns the
// Shopper to the page they were on, with its query but for a price range, in its
// language. It works before any script has loaded, and Safari's seven days for what a page's script writes
// do not apply. The choice is not in the page's address: a link opens in the
// currency of whoever opens it.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown, as the language switch does, and its query. Every
// Shopper page is drawn for each request, since the frame reads the chosen
// currency from it, so the server knows the query too. The server renders it
// as well, so the form is in the page as it arrives. The "not found" screen is
// the exception, because the browser draws that whole screen by script.
//
// The server hands it the two choices, each with its name in the page's
// language, and which one is chosen. It reads no cookie itself.
export function CurrencySwitch({
  language,
  current,
  label,
  choices,
}: {
  language: Language;
  current: Currency;
  label: string;
  choices: { currency: Currency; name: string }[];
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
      aria-label={label}
      data-testid="currency-switch"
    >
      <input type="hidden" name="page" value={page} />
      <ul className="flex">
        {choices.map(({ currency, name }) => (
          <li key={currency}>
            <button
              type="submit"
              name="currency"
              value={currency}
              aria-current={currency === current ? 'true' : undefined}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-3 underline aria-[current=true]:font-bold aria-[current=true]:no-underline"
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
