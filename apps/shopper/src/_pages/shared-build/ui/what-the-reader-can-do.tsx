import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress } from '@/entities/build';
import { sharedBuildAddress, sharedBuildLink } from '@/entities/shared-build';
import { underlinedAction } from '@/features/change-the-build';
import { CopyIntoMyBuild, type CopyRefusal } from '@/features/copy-a-shared-build';
import { ShareTheLink } from '@/features/share-a-build';
import { publicAddress } from '@/shared/config';
import { PrintedMark } from '@/shared/ui';

// What the reader of a Shared Build can do, on its slip under a dashed rule
// above its foot (DESIGN.md's The Shared Build page, Its slip), each 52
// pixels tall and as wide as the slip, 12 pixels apart: Copy into my Build,
// the page's one primary button, which asks once first when the browser
// holds a Build of its own; or, for a browser that holds this very Build, as
// the sender's does after sharing, "This is your Build" in the copy's place,
// with no copy; a copy refused said under it; then the link and Share the
// link.
export async function WhatTheReaderCanDo({
  sharedBuildId,
  parts,
  ownParts,
  isYours,
  refused,
}: {
  sharedBuildId: string;
  // How many Parts the Shared Build holds today, and the browser's own Build.
  parts: number;
  ownParts: number;
  isYours: boolean;
  refused: CopyRefusal | undefined;
}) {
  const [language, t] = await Promise.all([
    getLocale(),
    getTranslations('SharedBuildPage'),
  ]);
  const page = sharedBuildAddress(language, sharedBuildId);
  const counts = {
    mine: ownParts,
    mineText: formatNumber(ownParts),
    theirsText: formatNumber(parts),
  };

  return (
    <>
      {isYours ? (
        <ThisIsYourBuild
          words={{ title: t('yours.title'), note: t('yours.note'), goTo: t('yours.goTo') }}
          buildAddress={buildAddress(language)}
        />
      ) : (
        <CopyIntoMyBuild
          action={`${page}/copy`}
          sharedBuildAddress={page}
          ownParts={ownParts}
          words={{
            button: t('copy.button'),
            busy: t('copy.busy'),
            warning: t('copy.warning', counts),
            confirm: t('copy.confirm', counts),
            keep: t('copy.keep'),
          }}
        />
      )}
      {refused !== undefined && !isYours && (
        <output data-testid="copy-refused" className="block text-base">
          {t('copy.refused')}
        </output>
      )}
      <ShareTheLink
        link={sharedBuildLink(publicAddress(), language, sharedBuildId)}
        words={{
          label: t('link.label'),
          share: t('link.share'),
          copy: t('link.copy'),
          copied: t('link.copied'),
        }}
      />
    </>
  );
}

// "This is your Build" (DESIGN.md's The Shared Build page): the printed mark
// of a chosen thing, then at 600 that this is the Build the browser holds
// now, in Soft Ink that changing it later does not change this link, and
// "Go to your Build", underlined words to the Build page. No copy is
// offered.
function ThisIsYourBuild({
  words,
  buildAddress: address,
}: {
  words: { title: string; note: string; goTo: string };
  buildAddress: string;
}) {
  return (
    <div
      data-testid="this-is-your-build"
      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1 text-start"
    >
      <span className="mt-0.5 text-foreground">
        <PrintedMark kind="chosen" />
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-1">
        <p className="font-semibold">{words.title}</p>
        <p className="text-muted-foreground">{words.note}</p>
        <a href={address} className={`${underlinedAction} justify-self-start`}>
          {words.goTo}
        </a>
      </div>
    </div>
  );
}
