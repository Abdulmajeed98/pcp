import {
  dashboardMessages,
  directions,
  type Language,
  languageForBrowser,
  languages,
  sharedTerms,
} from '@pcp/i18n';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// The language of the browser the dashboard is open in, by `i18n`'s rule:
// the first of the browser's languages that the platform has, and Kurdish
// when it has none of them. A browser that states no list states one
// language.
export function languageOfTheBrowser(): Language {
  return languageForBrowser(
    navigator.languages.length > 0 ? navigator.languages : [navigator.language],
  );
}

// Starts the dashboard's languages, once, before anything is rendered: the
// text of all three is given to i18next at once, and the dashboard is shown
// in `language`. The document then declares the language and its direction.
// The direction comes from `i18n`, and no library is asked for it.
//
// The text is the dashboard's own and the shared terms, which a component
// asks for alike. No language falls back to another: a message missing from
// one shows its key, and is found by looking.
//
// React escapes what it shows, so i18next does not. A value is never written
// into a message: it is put into the element the message names for it, such
// as `<name/>`, and React shows it there as text.
export async function startLanguage(language: Language): Promise<void> {
  await i18next.use(initReactI18next).init({
    lng: language,
    supportedLngs: languages,
    fallbackLng: false,
    resources: Object.fromEntries(
      languages.map((each) => [
        each,
        { translation: { ...sharedTerms[each], ...dashboardMessages[each] } },
      ]),
    ),
    interpolation: { escapeValue: false },
  });

  document.documentElement.lang = language;
  document.documentElement.dir = directions[language];
}
