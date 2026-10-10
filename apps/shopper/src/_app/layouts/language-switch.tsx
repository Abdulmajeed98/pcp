'use client';

import { type Language, languageNames, languages } from '@pcp/i18n';
import { usePathname } from 'next/navigation';

// The language switch: three links to the page the Shopper is on, one in each
// language. Each is named in its own language and script, on every page, so
// that a Shopper can find theirs on a page they cannot read. The one the page
// is in is marked as the current one, and is bold where the others are
// underlined. Each link is at least 44 pixels each way, which is large enough
// to tap with a thumb.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown. The server renders it as well, so the three links
// are in the page as it arrives, and a tap on one works before any script
// has loaded. The "not found" screen is the exception, because the browser
// draws that whole screen by script.
//
// They are plain links, and neither Next's nor next-intl's. A tap therefore
// asks the server for the page, and it is the server's answer that writes the
// choice down, for a year. next-intl's own link changes the page in place
// once the scripts run, and writes the choice down from the browser. Safari
// keeps what a page's script writes for seven days at most.
export function LanguageSwitch({ current, label }: { current: Language; label: string }) {
  // The first part of an address is the page's language, and the rest is the
  // page.
  const page = usePathname().replace(/^\/[^/]+/, '');

  return (
    <nav aria-label={label} data-testid="language-switch">
      <ul className="flex">
        {languages.map((language) => (
          <li key={language}>
            <a
              href={`/${language}${page}`}
              lang={language}
              hrefLang={language}
              aria-current={language === current ? 'page' : undefined}
              className="flex min-h-11 min-w-11 items-center justify-center px-3 underline aria-[current=page]:font-bold aria-[current=page]:no-underline"
            >
              {languageNames[language]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
