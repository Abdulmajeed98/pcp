import type { Language, ShopperMessages } from '@pcp/i18n';

// What next-intl is told about this app, so that it type-checks against it:
// a language is one of the platform's three, and a key that the English
// language file does not have fails type-checking.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Language;
    Messages: ShopperMessages;
  }
}
