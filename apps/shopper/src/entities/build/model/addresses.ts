import type { Language } from '@pcp/i18n';

// The part of the Build page's address after its language, as its preview
// names it in every language.
export const buildPath = '/build';

// The Build page's address, in a language: `/<language>/build`. The frame
// leads to it from every page, and every form that changes the Build is
// answered with it. A Category's picker lies under it, as the category
// entity writes it (`pickerAddress`).
export function buildAddress(language: Language): string {
  return `/${language}${buildPath}`;
}
