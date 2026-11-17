import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress } from '@/entities/build';
import { sharedBuildAddress, sharedBuildLink } from '@/entities/shared-build';
import { underlinedAction } from '@/features/change-the-build';
import { CopyIntoMyBuild, type CopyRefusal } from '@/features/copy-a-shared-build';
import { PrintedLink, ShareTheLinkButton } from '@/features/share-a-build';
import { publicAddress } from '@/shared/config';
import { PrintedMark } from '@/shared/ui';

// The Shared Build slip's one action, right under its price lines and above
// the rules' counts a desk shows (DESIGN.md's The Shared Build page, Its
// slip; the owner's answer of 17 November 2026), as wide as the slip and 52
// pixels tall, so that it is on the first screen at every width: Copy into
// my Build, the page's one primary button, which asks once first when the
// browser holds a Build of its own, with a copy refused said under it; or,
// for a browser that holds this very Build, as the sender's does after
// sharing, Share the link, since there is nothing to copy.
export async function TheSlipsAction({
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
  if (isYours) {
    return (
      <ShareTheLinkButton
        link={sharedBuildLink(publicAddress(), language, sharedBuildId)}
        words={{ share: t('link.share'), copy: t('link.copy'), copied: t('link.copied') }}
      />
    );
  }
  const page = sharedBuildAddress(language, sharedBuildId);
  const counts = {
    mine: ownParts,
    mineText: formatNumber(ownParts),
    theirsText: formatNumber(parts),
  };

  return (
    <>
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
      {refused !== undefined && (
        <output data-testid="copy-refused" className="block text-base">
          {t('copy.refused')}
        </output>
      )}
    </>
  );
}

// What else the reader can do, on the Shared Build's sheet under the note
// of when it was shared (DESIGN.md's The Shared Build page, Its sheet; the
// owner's answer of 17 November 2026), at most 24rem wide and centred, its
// words set from their start: for the browser that holds this very Build,
// "This is your Build"'s words; then the link, printed; and for a reader,
// Share the link under it, as wide as the piece.
export async function TheLinkOnTheSheet({
  sharedBuildId,
  isYours,
}: {
  sharedBuildId: string;
  isYours: boolean;
}) {
  const [language, t] = await Promise.all([
    getLocale(),
    getTranslations('SharedBuildPage'),
  ]);
  const link = sharedBuildLink(publicAddress(), language, sharedBuildId);

  return (
    <div
      data-testid="share-the-link"
      className="mx-auto mt-8 grid w-full max-w-[24rem] grid-cols-[minmax(0,1fr)] gap-3"
    >
      {isYours && (
        <ThisIsYourBuild
          words={{ title: t('yours.title'), note: t('yours.note'), goTo: t('yours.goTo') }}
          buildAddress={buildAddress(language)}
        />
      )}
      <PrintedLink link={link} label={t('link.label')} />
      {!isYours && (
        <ShareTheLinkButton
          link={link}
          words={{ share: t('link.share'), copy: t('link.copy'), copied: t('link.copied') }}
        />
      )}
    </div>
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
