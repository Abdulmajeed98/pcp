import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

import { chosenCurrency, currencies, currencyMarks } from '@/shared/currency';
import { type Scheme, schemeAfter, schemeIn, schemes } from '@/shared/scheme';

import { CurrencySwitch } from './currency-switch';
import { LanguageSwitch } from './language-switch';
import { SchemeSwitch } from './scheme-switch';

// The frame's three switches (DESIGN.md's The switches), in one row, in this
// order: the currency, the language and the colours, each told apart by its
// own name before it from 48rem, by the gap between them and by what it
// holds. On a phone they take one row, the name slot one above it. Each
// works before any script has loaded, as a plain link or a plain form, and
// is remembered for a year. The server reads the Shopper's choices and hands
// each switch its words in the page's language.
export async function Switches() {
  const [language, currency, sent, t] = await Promise.all([
    getLocale(),
    chosenCurrency(),
    cookies(),
    getTranslations('Frame'),
  ]);
  const scheme = schemeIn(sent);
  const names = Object.fromEntries(
    schemes.map((each) => [each, t(`schemes.${each}`)]),
  ) as Record<Scheme, string>;
  const turn = Object.fromEntries(
    schemes.map((each) => [
      each,
      t('schemeTurn', { now: names[each], next: names[schemeAfter(each)] }),
    ]),
  ) as Record<Scheme, string>;

  return (
    <div
      data-testid="switches"
      className="flex flex-wrap items-center gap-x-1 sm:gap-x-3 md:gap-x-6"
    >
      <CurrencySwitch
        language={language}
        current={currency}
        label={t('currencySwitch')}
        choices={currencies.map((each) => ({
          currency: each,
          name: t(`currencies.${each}`),
          mark: currencyMarks[each],
        }))}
      />
      <LanguageSwitch current={language} label={t('languageSwitch')} />
      <SchemeSwitch
        language={language}
        current={scheme}
        words={{ label: t('schemeSwitch'), names, turn }}
      />
    </div>
  );
}
