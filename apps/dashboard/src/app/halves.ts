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

// The language each half is shown in. The Admin console is in English,
// whatever the browser's language is. The Vendor portal follows the browser,
// and falls back to Kurdish.
export function languageOf(half: Half): Language {
  return half === 'admin-console' ? 'en' : languageOfTheBrowser();
}

// The title of the browser's tab in each half, once its language has
// started. The Admin console's is English, and is written here.
export function titleOf(half: Half): string {
  return half === 'admin-console' ? 'Admin console' : t('VendorPortal.title');
}
