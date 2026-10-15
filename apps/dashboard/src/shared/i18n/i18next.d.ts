import type { DashboardMessages, SharedTerms } from '@pcp/i18n';

// What i18next is told about this app, so that it type-checks against it: a
// key that the English language files do not have fails type-checking, a
// shared term's key among them.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: SharedTerms & DashboardMessages };
  }
}
