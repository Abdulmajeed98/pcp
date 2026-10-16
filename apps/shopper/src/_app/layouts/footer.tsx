import { openDbAtThePinnedCommit, openDbLicence, openDbName } from '@pcp/opendb';
import { AlwaysEnglish } from '@pcp/ui';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

// The footer every Shopper page shares, the "not found" screen among them. It
// credits BuildCores OpenDB, as ODC-By 1.0 asks of anyone who shows its data
// (CAT-9), in the words of the licence's own example notice, in the
// Shopper's language. OpenDB's name and the licence's are English in every
// language, and the language files mark them so, with `<english>`, to be kept
// apart from the sentence around them, so that a Kurdish or an Arabic
// sentence cannot reorder them. Each links to its source: OpenDB at the
// commit the platform imported, where its licence is still ODC-By, and the
// licence itself.
//
// Its lines are as tall as a control, so that each link is 44 pixels high
// and the two never share a thumb's reach when they fall on two lines.
//
// It is rendered on the server with the rest of the page, and needs no
// script.
export async function Footer() {
  const t = await getTranslations('Footer');

  return (
    <footer className="mt-12 border-t border-border pt-4 text-sm text-muted-foreground">
      <p data-testid="credit" className="leading-11">
        {t.rich('credit', {
          openDb: openDbName,
          licence: openDbLicence.name,
          openDbLink: (chunks) => (
            <Source address={openDbAtThePinnedCommit}>{chunks}</Source>
          ),
          licenceLink: (chunks) => (
            <Source address={openDbLicence.address}>{chunks}</Source>
          ),
          english: (chunks) => <AlwaysEnglish>{chunks}</AlwaysEnglish>,
        })}
      </p>
    </footer>
  );
}

// A link inside the credit's sentence, in the manual's blue, as every link
// is drawn.
function Source({ address, children }: { address: string; children: ReactNode }) {
  return (
    <a
      href={address}
      className="inline-block min-h-control text-primary underline underline-offset-4 hover:decoration-2"
    >
      {children}
    </a>
  );
}
