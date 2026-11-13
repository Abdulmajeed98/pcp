import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

import { buildAddress, buildIn, partsCountedIn } from '@/entities/build';

// The way to the Build (DESIGN.md's The way to the Build): a link to the
// Build page on every page, "Your Build" in Body at 600 (Body large from
// 48rem), followed by how many Parts the Build holds, read from its cookie,
// in tabular figures in a small square of the Ink with the paper's colour,
// at least 28 pixels square; "0" for an empty Build. Its name for a screen
// reader says both, "Your Build, 8 Parts". On the Build page it is marked as
// the page the Shopper is on. Its words are not selected under a resting
// thumb, and a press settles it (Motion 8).
export async function WayToTheBuild({ onTheBuildPage }: { onTheBuildPage: boolean }) {
  const [language, sent, t] = await Promise.all([
    getLocale(),
    cookies(),
    getTranslations('Frame'),
  ]);
  const count = partsCountedIn(buildIn(sent));

  return (
    <a
      href={buildAddress(language)}
      aria-label={t('yourBuildName', { count, countText: formatNumber(count) })}
      aria-current={onTheBuildPage ? 'page' : undefined}
      data-testid="frame-build"
      data-count={count}
      className="pressable no-callout inline-flex min-h-control items-center gap-2 text-base font-semibold no-underline decoration-2 underline-offset-4 hover:underline md:text-lg"
    >
      {t('yourBuild')}
      <span
        aria-hidden="true"
        className="figures inline-grid h-7 min-w-7 place-items-center bg-foreground px-1.5 text-sm font-semibold text-card"
      >
        {formatNumber(count)}
      </span>
    </a>
  );
}
