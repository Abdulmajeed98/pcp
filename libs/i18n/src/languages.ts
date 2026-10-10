import { match } from '@formatjs/intl-localematcher';

// The platform's three languages, by their tags: Kurdish (Sorani), Arabic and
// English. They are listed in this order wherever the three are listed. The
// Keycloak realm uses the same three tags.
export const languages = ['ckb', 'ar', 'en'] as const;

export type Language = (typeof languages)[number];

export type Direction = 'rtl' | 'ltr';

// The language used wherever nothing else decides.
export const fallbackLanguage: Language = 'ckb';

// Each language's own name, in its own script. A list of the languages shows
// these names on every page and never translates them, so that a Shopper can
// find theirs on a page they cannot read.
export const languageNames: Record<Language, string> = {
  ckb: 'کوردی',
  ar: 'العربية',
  en: 'English',
};

// The direction each language is laid out in. It is stated here once, and
// neither frontend asks a library for it.
export const directions: Record<Language, Direction> = {
  ckb: 'rtl',
  ar: 'rtl',
  en: 'ltr',
};

// The language for a browser, from the languages it states in its own order
// of preference: the first one the platform has, and Kurdish when it has
// none of them. A regional form counts as its language, so Arabic as written
// in Iraq is Arabic.
//
// next-intl decides the Shopper app's first visit with this library and this
// method, "best fit". A frontend without next-intl decides with this
// function, and so decides alike. next-intl hands the library the languages
// with the longest tag first, to get round a fault in it, and the three are
// in that order as they stand.
//
// The method also knows a few relations between languages: it gives English
// for a browser set to Urdu.
export function languageForBrowser(preferred: readonly string[]): Language {
  try {
    const matched = match(preferred, languages, fallbackLanguage, {
      algorithm: 'best fit',
    });
    return languages.find((language) => language === matched) ?? fallbackLanguage;
  } catch {
    // The library throws at a tag it cannot read. next-intl answers that with
    // its default language, which is the fallback.
    return fallbackLanguage;
  }
}
