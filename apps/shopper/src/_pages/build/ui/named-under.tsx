import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { partAddress } from '@/entities/part';

import type { PartNamed } from '../model/findings';

// How many of an outcome's lines show before the rest fold (DESIGN.md's The
// words of an outcome), as a filter's values fold past twelve.
const shownBeforeTheFold = 3;

// A Part named under an outcome, in English, left to right in every language
// (LANG-3), as a link to its Part page when it is a Visible Part.
export async function PartName({ part }: { part: PartNamed }) {
  const language = await getLocale();
  const name = <AlwaysEnglish>{part.name}</AlwaysEnglish>;
  return part.visible ? (
    <a
      href={partAddress(language, part.id)}
      data-testid="named-part"
      data-part={part.id}
      className="hover-underline"
    >
      {name}
    </a>
  ) : (
    <span data-testid="named-part" data-part={part.id}>
      {name}
    </span>
  );
}

// The lines under an outcome's sentence, in Body Soft Ink, each on a line of
// its own: the Parts it names, or what an unchecked rule could not read.
// Past three the rest fold behind "6 more", "Fewer" once open, a disclosure
// that works before any script has loaded and opens in place as the
// filters' fold does, so that the worst Build stays readable on a phone
// (break-ui, builder ticket 06).
export async function NamedUnder({
  lines,
}: {
  lines: readonly { key: string; line: ReactNode }[];
}) {
  const t = await getTranslations('BuildPage.rules');
  const shown =
    lines.length > shownBeforeTheFold ? lines.slice(0, shownBeforeTheFold) : lines;
  const folded = lines.slice(shown.length);
  const listed = (some: readonly { key: string; line: ReactNode }[]) =>
    some.map(({ key, line }) => (
      <li key={key} className="min-w-0 wrap-break-word">
        {line}
      </li>
    ));

  return (
    <ul className="mt-1.5 grid grid-cols-[minmax(0,1fr)] gap-1 text-base text-muted-foreground">
      {listed(shown)}
      {folded.length > 0 && (
        <li>
          <details data-testid="more-named" className="group/more unfolds-in-place">
            <summary className="pressable no-callout inline-flex min-h-control min-w-control cursor-pointer list-none items-center text-foreground [&::-webkit-details-marker]:hidden">
              <span className="hover-underline group-open/more:hidden">
                {t('more', {
                  count: folded.length,
                  countText: formatNumber(folded.length),
                })}
              </span>
              <span className="hover-underline hidden group-open/more:inline">
                {t('fewer')}
              </span>
            </summary>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">{listed(folded)}</ul>
          </details>
        </li>
      )}
    </ul>
  );
}
