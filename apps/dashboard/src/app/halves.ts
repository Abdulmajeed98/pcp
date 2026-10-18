import { languageOfTheBrowser, rememberedLanguage, type ShownIn, t } from '@/shared/i18n';

// The dashboard's two halves: the Admin console, for the Admin, and the
// Vendor portal, for a Vendor.
export type Half = 'admin-console' | 'vendor-portal';

// The one rule for which half a login gets. It is applied once, when the
// dashboard starts, to the realm roles the login holds. A login that holds
// the Admin role gets the Admin console, also when it holds the Vendor role
// too. Every other login gets the Vendor portal, which first asks the API for
// the Caller's own Vendor, and shows a plain message to a login with no
// Vendor behind it. Role names are compared without regard to case, as the
// API compares them.
//
// The Admin console can also show a Vendor's portal, at an address under the
// Vendor's page, for the Admin acting as that Vendor with the Admin's own
// Login. That is a screen of the Admin console, and no rule of its own: the
// Admin keeps the Admin console.
export function halfFor(realmRoles: readonly string[]): Half {
  return realmRoles.some((role) => role.toLowerCase() === 'admin')
    ? 'admin-console'
    : 'vendor-portal';
}

// What each half is shown in: its language, and the title of the browser's
// tab once that language has started.
//
// The Admin console is in English, whatever the browser's language is, and
// its title is written here. It neither reads nor writes the language a
// Vendor chose, so that the Admin's visit to a Vendor's browser changes
// nothing for either. While the Admin acts as a Vendor, the Admin console
// shows that Vendor's portal in what the Vendor portal is shown in, and its
// switch reads and writes the language chosen in this browser, the Admin's
// own; leaving the portal shows the Admin console in English again.
//
// The Vendor portal opens in the language chosen with its switch in this
// browser, else in the browser's own, else in Kurdish, and its title is in
// the language files. So does what is shown before anyone is known, such as
// a login that could not be completed.
export const halves: Record<Half, ShownIn> = {
  'admin-console': {
    language: () => 'en',
    title: () => 'Admin console',
  },
  'vendor-portal': {
    language: () => rememberedLanguage() ?? languageOfTheBrowser(),
    title: () => t('VendorPortal.title'),
  },
};
