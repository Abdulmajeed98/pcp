import { languageNames, languages } from '@pcp/i18n';

import { chooseLanguage, useTranslation } from '@/shared/i18n';

// The Vendor portal's language switch: one button for each language, named
// in its own language and script, on every screen, so that a Vendor can find
// theirs on a screen they cannot read. The one the portal is in is shown as
// pressed, on a quiet ground and in a heavier weight. Each button is at least
// 44 pixels each way, which is large enough to tap with a thumb.
//
// A tap changes the language in place: the screen is drawn again in it, with
// no reload and no visit to Keycloak, so nothing the Vendor was doing is
// lost. The choice is remembered in this browser.
//
// It is buttons and not links, as the Shopper app's switch is, because the
// Vendor portal has no address for each language.
export function LanguageSwitch({ label }: { label: string }) {
  const { i18n } = useTranslation();

  return (
    <nav aria-label={label} data-testid="language-switch">
      <ul className="flex">
        {languages.map((language) => (
          <li key={language}>
            <button
              type="button"
              lang={language}
              aria-pressed={language === i18n.language}
              className="flex min-h-control min-w-control items-center justify-center rounded-lg px-3 aria-pressed:bg-secondary aria-pressed:font-semibold"
              onClick={() => void chooseLanguage(language)}
            >
              {languageNames[language]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
