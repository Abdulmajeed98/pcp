'use client';

import { languageNames, languages } from '@pcp/i18n';
import { useLocale } from 'next-intl';

import { Link, usePathname } from '@/shared/navigation';

// The language switch: three links to the page the Shopper is on, one in each
// language. Each is named in its own language and script, on every page, so
// that a Shopper can find theirs on a page they cannot read. The one the page
// is in is marked as the current one, and is bold where the others are
// underlined.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown. The server renders it as well, so the three links
// are in the page as it arrives, and a tap on one works with no script.
//
// Each link is at least 44 pixels each way, which is large enough to tap with
// a thumb.
export function LanguageSwitch({ label }: { label: string }) {
  const current = useLocale();
  const address = usePathname();

  return (
    <nav aria-label={label} data-testid="language-switch">
      <ul className="flex">
        {languages.map((language) => (
          <li key={language}>
            <Link
              href={address}
              locale={language}
              lang={language}
              aria-current={language === current ? 'page' : undefined}
              className="flex min-h-11 min-w-11 items-center justify-center px-3 underline aria-[current=page]:font-bold aria-[current=page]:no-underline"
            >
              {languageNames[language]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
