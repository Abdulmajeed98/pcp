import type { Language } from '@pcp/i18n';

import { languageOfTheBrowser, t } from '@/shared/i18n';

// The dashboard's two halves: the Admin console, for the Admin, and the
// Vendor portal, for a Vendor.
export type Half = 'admin-console' | 'vendor-portal';

// The one rule for which half a login gets. It is applied once, when the
// dashboard starts, to the realm roles the login holds. A login that holds
// the Admin role gets the Admin console, also when it holds the Vendor role
// too, and every other login gets the Vendor portal. Role names are compared
// without regard to case, as the API compares them.
export function halfFor(realmRoles: readonly string[]): Half {
  return realmRoles.some((role) => role.toLowerCase() === 'admin')
    ? 'admin-console'
    : 'vendor-portal';
}

// What each half is shown in: its language, and the title of the browser's
// tab once that language has started.
//
// The Admin console is in English, whatever the browser's language is, and
// its title is written here. The Vendor portal follows the browser and falls
// back to Kurdish, and its title is in the language files. So does what is
// shown before anyone is known, such as a login that could not be completed.
export const halves: Record<Half, { language: () => Language; title: () => string }> = {
  'admin-console': {
    language: () => 'en',
    title: () => 'Admin console',
  },
  'vendor-portal': {
    language: languageOfTheBrowser,
    title: () => t('VendorPortal.title'),
  },
};
