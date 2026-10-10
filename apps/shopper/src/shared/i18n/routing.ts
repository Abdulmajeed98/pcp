import { fallbackLanguage, languages } from '@pcp/i18n';
import { defineRouting } from 'next-intl/routing';

// next-intl's statement of the Shopper app's languages. The language is the
// first part of every page's address, for all three: none has a bare address.
// An address with no language is answered with a redirect to the same address
// in the browser's language, and in the fallback when the platform does not
// have it.
//
// With each page next-intl sends that page's address in the other languages,
// for search engines. That is on unless it is switched off here.
//
// next-intl can also remember a language in a cookie, and would then send an
// address with no language to the language of the last address opened, for
// as long as the browser stays open. Nothing is remembered: an address with
// no language follows the browser alone.
export const routing = defineRouting({
  locales: languages,
  defaultLocale: fallbackLanguage,
  localePrefix: 'always',
  localeCookie: false,
});
