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

// Where the Vendor portal keeps the language a Vendor chose with the switch,
// in the browser's storage. It is the one thing the dashboard keeps there:
// the tokens stay in memory. A language that was only found from the
// browser's own is never kept, so that the Vendor portal follows the
// browser until the switch is used.
const rememberedKey = 'language';

// The language chosen with the switch in this browser, if one was. It lasts
// until the browser's storage is cleared, also across a logout.
export function rememberedLanguage(): Language | undefined {
  try {
    const remembered = localStorage.getItem(rememberedKey);
    return languages.find((language) => language === remembered);
  } catch {
    // A browser may refuse a page its storage. Nothing is remembered then.
    return undefined;
  }
}

// What the dashboard is shown in: its language, and the title of the
// browser's tab, which is asked for once that language has started.
export interface ShownIn {
  language: () => Language;
  title: () => string;
}

// The title of the browser's tab in the language shown. `startLanguage` sets
// it, once, as i18next keeps its own state once.
let titleOfTheTab = (): string => document.title;

// Starts the dashboard's languages, once, before anything is rendered: the
// text of all three is given to i18next at once, and the dashboard is shown
// in the language `shownIn` gives. The document then declares the language,
// its direction and the tab's title.
//
// The text is the dashboard's own and the shared terms, which a component
// asks for alike. No language falls back to another: a message missing from
// one shows its key, and is found by looking.
//
// React escapes what it shows, so i18next does not. A value is never written
// into a message: it is put into the element the message names for it, such
// as `<name/>`, and React shows it there as text.
export async function startLanguage(shownIn: ShownIn): Promise<void> {
  const language = shownIn.language();
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

  titleOfTheTab = shownIn.title;
  declare(language);
}

// What a use of the switch does: the dashboard is shown in `language` in
// place, with no reload and no visit to Keycloak, and the choice is
// remembered in this browser. Every component that shows text is drawn again
// in the new language, and the document declares it.
export async function chooseLanguage(language: Language): Promise<void> {
  try {
    localStorage.setItem(rememberedKey, language);
  } catch {
    // The choice still holds on this page. It is not remembered.
  }

  await i18next.changeLanguage(language);
  declare(language);
}

// The document declares the language it is shown in, and its direction, and
// the tab's title follows. The direction comes from `i18n`, and no library is
// asked for it.
function declare(language: Language): void {
  document.documentElement.lang = language;
  document.documentElement.dir = directions[language];
  document.title = titleOfTheTab();
}
