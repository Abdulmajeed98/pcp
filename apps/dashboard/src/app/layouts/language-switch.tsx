import { languageNames, languages } from '@pcp/i18n';

import { chooseLanguage, useTranslation } from '@/shared/i18n';

// The Vendor portal's language switch (DESIGN.md's Inputs and choices):
// segmented, one rectangle with 6-pixel corners and a Control Edge border,
// holding a button for each language, named in its own language and script,
// so that a Vendor can find theirs on a screen they cannot read. The one the
// portal is in is shown as pressed, on Active Stone at weight 600. Each
// button is as high as a control and at least as wide, 44 pixels on a
// touchscreen and 36 under a mouse. It is in the frame's top bar from 64rem,
// and in the menu sheet on a phone.
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
    <nav aria-label={label} data-testid="language-switch" className="shrink-0">
      <ul className="inline-flex rounded-control border border-input">
        {languages.map((language) => (
          <li key={language} className="flex">
            <button
              type="button"
              lang={language}
              aria-pressed={language === i18n.language}
              className="pressable flex h-control min-w-control items-center justify-center rounded-[calc(var(--radius-control)-1px)] px-3 text-sm whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-foreground motion-reduce:active:bg-secondary"
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
