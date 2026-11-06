import type { VisibleVendorResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { getTranslations } from 'next-intl/server';

import { type ContactLink, contactLinksOf, WrittenOnLines } from '@/entities/vendor';
import { TearOffTabs } from '@/shared/ui';

// How many tear-off tabs the coupon's foot is cut into, each a call: two rows
// of three on a phone, and one row from 48rem.
const tabs = 6;
const tabsAPhoneRowHolds = 3;

// The type of the Vendor's name on its coupon, the page's `h1`: the Sheet
// title while it is short, and the Facts size past 40 characters, so that a
// long name, up to the 100 characters a Vendor may write, reads as a name and
// not as a poster beside its contact details. Lines are 1.4 apart whatever
// the script, as Kurdish and Arabic need and the renderings had them.
function nameType(name: string): string {
  return name.length > 40 ? 'type-facts' : 'type-sheet-title';
}

// A name written in Latin script, with no letter of Arabic script, which a
// Vendor in Iraq writes in English: its element says so, so that it keeps
// the Latin setting of the display face on a Kurdish or an Arabic page, as a
// Part's name does, and a screen reader reads it as English. A name in
// Arabic script keeps the page's language, Kurdish and Arabic being alike in
// their letters, and its element marks its script instead, so that it takes
// the Arabic-script setting on an English page too (the theme's display
// type).
function inLatinScript(name: string): boolean {
  return !/\p{Script=Arabic}/u.test(name);
}

// The coupon (DESIGN.md's The coupon and A Vendor's contact details and
// their links): the Vendor's contact details as a coupon to cut out, a field
// of Coupon Green at most 72rem wide, about 2.2 to 1 from 48rem, its notches
// cut where its perforation runs. On its start half (46%), the Vendor's name
// as it wrote it (LANG-4), in the Sheet title, as the page's `h1`, and under
// it in Body large what the page is, "A Vendor of PC Parts in Erbil.", its
// city named in the page's language, so that the first screen says what
// the name is (Taste's inspector, `name-only-title`); at its foot its
// address as it wrote it, and its opening hours under "Opening hours" at
// 600, as it wrote them. What the Vendor wrote takes its own direction, its
// name and each line of its address and hours set from their own start, as
// a phone's messages are; what the platform writes, the page's. From 48rem
// to 64rem each half has 32 pixels of padding, so that the name and the
// hours keep their lines in a half of a coupon 768 pixels wide, and 48 from
// 64rem.
// On its end half, past the perforation, the links, each a cell 56 pixels
// tall of Deep Green with what it does at the start and the detail at the
// end: Call, the first, turned over in Coupon Ink with green words, a `tel:`
// link; WhatsApp, its chat; Instagram, its name with "@", its profile; Open
// in Google Maps, in a new tab, with its arrow. Phone numbers and the
// Instagram name run left to right in every language. A detail the Vendor
// has not given is left out, cell and line, so a Vendor with only its phone
// number has one cell. Under the coupon its tear-off tabs each carry the
// phone number, each a call. On a phone the coupon stands upright: its words
// above, the perforation across its middle, its cells below, one above the
// other.
//
// Each cell keeps the phone's own long-press menu, so that a Shopper can
// copy a Vendor's number, and its words are not selected under a resting
// thumb (DESIGN.md's The feel on a phone). The focus ring is drawn in the
// coupon's ink. The coupon does not move (DESIGN.md's What stays still).
export async function Coupon({ vendor }: { vendor: VisibleVendorResponse }) {
  const [t, city] = await Promise.all([
    getTranslations('VendorPage'),
    getTranslations('City'),
  ]);
  const links = contactLinksOf(vendor);
  const [call] = links;
  const latin = inLatinScript(vendor.name);

  return (
    <div className="mx-auto w-full max-w-[72rem] text-coupon-foreground [--ring:var(--coupon-foreground)]">
      <div
        data-testid="coupon"
        className="grid grid-cols-[minmax(0,1fr)] md:aspect-[2.2/1] md:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]"
      >
        <div className="coupon-words flex min-w-0 flex-col justify-between gap-8 bg-coupon px-5 py-6 md:p-8 lg:p-12">
          <div className="grid gap-3">
            <h1
              id="vendor-name"
              lang={latin ? 'en' : undefined}
              data-script={latin ? undefined : 'arabic'}
              className={cn('wrap-break-word', nameType(vendor.name))}
            >
              <AsWritten className="block leading-[1.4]">{vendor.name}</AsWritten>
            </h1>
            <p data-testid="what-the-vendor-is" className="text-lg">
              {t.rich('whatItIs', {
                city: city(vendor.city),
                place: (chunks) => <span data-testid="vendor-city">{chunks}</span>,
              })}
            </p>
          </div>
          <div className="grid gap-4">
            <p data-testid="vendor-address">
              <WrittenOnLines text={vendor.address} />
            </p>
            {vendor.openingHours !== null && (
              <p data-testid="vendor-opening-hours">
                <span className="block font-semibold">{t('openingHours')}</span>
                <WrittenOnLines text={vendor.openingHours} />
              </p>
            )}
          </div>
        </div>
        <ul
          aria-label={t('contactLinks')}
          data-testid="contact-links"
          className="coupon-cells grid min-w-0 content-center gap-2.5 bg-coupon perforated-above px-5 py-6 md:border-t-0 md:perforated-before md:p-8 lg:p-12"
        >
          {links.map((link) => (
            <li key={link.kind}>
              <ContactCell link={link} words={t(link.kind)} inANewTab={t('inANewTab')} />
            </li>
          ))}
        </ul>
      </div>
      {call !== undefined && (
        <TearOffTabs
          on="coupon"
          label={t('tabs')}
          perRowOnAPhone={tabsAPhoneRowHolds}
          tabs={Array.from({ length: tabs }, () => ({
            address: call.address,
            name: call.detail ?? '',
            english: true,
          }))}
        />
      )}
    </div>
  );
}

// An arrow out of the page, toward the end side and up, after Open in Google
// Maps, which opens in a new tab: drawn, since none of the page's faces
// draws an arrow, mirrored in Kurdish and Arabic, and hidden from readers,
// the link saying in words that it opens in a new tab.
function OutArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-4 shrink-0 rtl:-scale-x-100"
    >
      <path
        d="M4 12 L12 4 M6 4 H12 V10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}

// One of the coupon's cells, a link: what it does at the start and its
// detail at the end, as a person reads it, or the map's arrow, which opens
// Google Maps in a new tab, with nothing loaded from Google on the page
// (BRW-4). The first, Call, is turned over. Under a hovering pointer and
// while pressed, a cell takes its ground one step deeper, its words still at
// 4.5:1 or more, and a press settles it to 0.97 (Motion 8 and 9).
function ContactCell({
  link,
  words,
  inANewTab,
}: {
  link: ContactLink;
  words: string;
  inANewTab: string;
}) {
  const inItsOwnTab = link.kind === 'map';
  return (
    <a
      href={link.address}
      data-testid={`contact-${link.kind}`}
      target={inItsOwnTab ? '_blank' : undefined}
      rel={inItsOwnTab ? 'noreferrer' : undefined}
      className={cn(
        'pressable flex min-h-contact-cell flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 py-2',
        link.kind === 'call'
          ? 'bg-coupon-foreground font-semibold text-coupon hover:bg-coupon-call-pressed active:bg-coupon-call-pressed'
          : 'bg-coupon-cell hover:bg-coupon-cell-pressed active:bg-coupon-cell-pressed',
      )}
    >
      <span>
        {words}
        {inItsOwnTab && <span className="sr-only">{inANewTab}</span>}
      </span>
      {link.detail === null ? (
        <OutArrow />
      ) : (
        <AlwaysEnglish className="ms-auto min-w-0 wrap-anywhere">
          {link.detail}
        </AlwaysEnglish>
      )}
    </a>
  );
}
