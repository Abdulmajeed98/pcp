'use client';

import { type Language, languageNames, languages } from '@pcp/i18n';
import { usePathname, useSearchParams } from 'next/navigation';

import { addressInLanguage } from '@/shared/i18n';

import { choice } from './choice';

// The language switch: three links to the page the Shopper is on, one in each
// language, its query kept, so that a search, the filters and the page are
// not lost (story 29). Each is named in its own language and script, on
// every page, so that a Shopper can find theirs on a page they cannot read,
// and its names in Arabic script are 15 pixels at the least, on an English
// page too. The one the page is in is marked as the current one. They wrap
// onto another row where they do not fit, as with a phone's text at 200%.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown. The server renders it as well, so the three links
// are in the page as it arrives, and a tap on one works before any script
// has loaded. The "not found" screen of an unknown Category, Part or Vendor
// is the exception, because the browser draws that whole screen by script.
//
// They are plain links, and neither Next's nor next-intl's. A tap therefore
// asks the server for the page, and it is the server's answer that writes the
// choice down, for a year. next-intl's own link changes the page in place
// once the scripts run, and writes the choice down from the browser. Safari
// keeps what a page's script writes for seven days at most.
export function LanguageSwitch({ current, label }: { current: Language; label: string }) {
  const path = usePathname();
  const query = useSearchParams().toString();

  return (
    <nav aria-label={label} data-testid="language-switch" className="flex">
      <ul className="flex flex-wrap">
        {languages.map((language) => (
          <li key={language}>
            <a
              href={addressInLanguage(language, path, query)}
              lang={language}
              hrefLang={language}
              aria-current={language === current ? 'page' : undefined}
              data-chosen={language === current ? '' : undefined}
              className={`${choice} arabic-script-floor`}
            >
              {languageNames[language]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
