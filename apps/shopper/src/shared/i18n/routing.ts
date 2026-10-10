import { fallbackLanguage, languages } from '@pcp/i18n';
import { defineRouting } from 'next-intl/routing';

// How long a language is remembered for.
const aYearInSeconds = 60 * 60 * 24 * 365;

// next-intl's statement of the Shopper app's languages. The language is the
// first part of every page's address, for all three: none has a bare address.
// An address with no language is answered with a redirect to the same address
// in a language: the remembered one, else the browser's, else the fallback.
//
// With each page next-intl sends that page's address in the other languages,
// for search engines. That is on unless it is switched off here.
//
// The language is remembered in next-intl's cookie. As it comes, that cookie
// lasts until the browser is closed, so it is given a lifetime here: a
// Shopper chooses once and finds the choice again another day. An address
// that names a language is shown in that language whatever is remembered,
// and the language of the last address opened is what is remembered from
// then on.
export const routing = defineRouting({
  locales: languages,
  defaultLocale: fallbackLanguage,
  localePrefix: 'always',
  localeCookie: { maxAge: aYearInSeconds },
});
