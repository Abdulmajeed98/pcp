import { openDbAtThePinnedCommit, openDbLicence, openDbName } from '@pcp/opendb';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { type Category, categoryAddress } from '@/entities/category';
import type { Photograph } from '@/shared/photographs';
import { buttonVariants } from '@/shared/ui';

// The four Categories the back cover leads to, as the renderings the owner
// chose did.
const someCategories: readonly Category[] = ['cpu', 'gpu', 'motherboard', 'ram'];

// The back cover (DESIGN.md's The back cover): the close and the footer of
// every page in one field of the Back Cover's colour, at least a screen tall.
// At the top, an invitation at Display size over Choose a Category, and in
// columns 10 to 12 four Categories as links; above the foot, the credits; at
// the foot, the cropped name, a picture of the name slot's words that the
// field's edges cut through, hidden from readers.
//
// The credits are the footer's credit to BuildCores OpenDB, as ODC-By 1.0
// asks of anyone who shows its data (CAT-9), in the words of the licence's
// own notice, in the Shopper's language, with OpenDB's name and the
// licence's English in every language and each a link to its source; then
// the photographs the page shows, each by its title, its author and its
// licence, each a link, with what the page did to it. Each line wraps, and
// is as tall as a control, so that each link is 44 pixels high.
//
// The focus ring is drawn in the cover's own ink. A word wider than the
// window, as a Kurdish one is at a phone's largest text, breaks where it
// must rather than run past the window's edge. It is rendered on the server
// with the rest of the page, and needs no script.
export async function BackCover({ photographs }: { photographs: readonly Photograph[] }) {
  const [language, t, site, categoryName, credit] = await Promise.all([
    getLocale(),
    getTranslations('BackCover'),
    getTranslations('Site'),
    getTranslations('Category'),
    getTranslations('Footer'),
  ]);
  const english = (chunks: ReactNode) => <AlwaysEnglish>{chunks}</AlwaysEnglish>;

  return (
    <footer
      data-testid="back-cover"
      className="page-margins flex min-h-svh flex-col overflow-hidden bg-back-cover pt-section-phone text-back-cover-foreground wrap-anywhere [--ring:var(--back-cover-foreground)] md:pt-[4.5rem]"
    >
      <div className="grid gap-x-6 gap-y-10 md:grid-cols-12">
        <div className="grid justify-items-start gap-7 md:col-span-7">
          <h2 className="type-display">{t('invitation')}</h2>
          <a
            href={`/${language}#categories`}
            className={buttonVariants({ kind: 'primary', className: 'w-full md:w-auto' })}
          >
            {t('chooseACategory')}
          </a>
        </div>
        <nav aria-label={t('someCategories')} className="md:col-span-3 md:col-start-10">
          <ul className="grid gap-1">
            {someCategories.map((category) => (
              <li key={category}>
                <a
                  href={categoryAddress(language, category)}
                  className="hover-underline inline-flex min-h-control items-center text-lg"
                >
                  {categoryName(category)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-auto flex flex-wrap justify-between gap-x-6 gap-y-2 pt-[4.5rem] text-base">
        <p data-testid="credit" className="max-w-[70ch] leading-11">
          {credit.rich('credit', {
            openDb: openDbName,
            licence: openDbLicence.name,
            openDbLink: (chunks) => (
              <Source address={openDbAtThePinnedCommit}>{chunks}</Source>
            ),
            licenceLink: (chunks) => (
              <Source address={openDbLicence.address}>{chunks}</Source>
            ),
            english,
          })}
        </p>
        {photographs.length > 0 && (
          <section aria-labelledby="photographs-on-this-page" className="max-w-[70ch]">
            <h2 id="photographs-on-this-page" className="sr-only">
              {t('photographs')}
            </h2>
            <ul data-testid="photograph-credits" className="leading-11">
              {photographs.map((photograph) => (
                <li key={photograph.source}>
                  {t.rich('photograph', {
                    title: photograph.title,
                    author: photograph.author,
                    licence: photograph.licence.name,
                    changed: photograph.changed,
                    source: (chunks) => (
                      <Source address={photograph.source}>{chunks}</Source>
                    ),
                    licenceLink: (chunks) => (
                      <Source address={photograph.licence.address}>{chunks}</Source>
                    ),
                    english,
                  })}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p aria-hidden="true" className="type-cropped-name mt-3 text-back-cover-foreground">
        {site('name')}
      </p>
    </footer>
  );
}

// A link inside the credits, underlined, 2 pixels under a hovering pointer.
function Source({ address, children }: { address: string; children: ReactNode }) {
  return (
    <a href={address} className="hover-underline">
      {children}
    </a>
  );
}
