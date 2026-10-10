import type { Language, SharedTerms, ShopperMessages } from '@pcp/i18n';

// What next-intl is told about this app, so that it type-checks against it:
// a language is one of the platform's three, and a key that the English
// language files do not have fails type-checking, a shared term's key among
// them.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Language;
    Messages: SharedTerms & ShopperMessages;
  }
}
