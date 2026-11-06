import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import type { CSSProperties } from 'react';

// Tear-off tabs (DESIGN.md's Tear-off tabs): the foot of a piece cut into
// tabs along a perforation, each a link, its words read upright along the
// tab. A tab is at least 44 pixels wide and 150 pixels tall, 130 on a phone,
// where they take rows of `perRowOnAPhone`. They are listed in the reading
// order, and so mirror in Kurdish and Arabic. Their perforations are dashed
// in Half Ink, 3 pixels along their top and 2 between them. A tab leans from
// its perforation under the pointer and when pressed (Motion 5), and its
// words are not selected under a resting thumb.
//
// On a sheet they end (`on="sheet"`), they run to its edges through its
// padding, so the sheet's own cut edge is their foot, and they are the
// sheet's way to its links. Under the Vendor's coupon (`on="coupon"`) they
// are the coupon's own foot, printed in its green with its words in its ink,
// their perforations in its ink at 60% so that they meet 3:1, and the same
// call six times, so they are a group of links rather than a way round the
// site. A tab whose words are English in every language, as a phone number
// is, says so (`english`), and reads along the tab as Latin script does on
// a Kurdish or an Arabic page too.
export function TearOffTabs({
  label,
  tabs,
  perRowOnAPhone,
  on = 'sheet',
}: {
  label: string;
  tabs: readonly { address: string; name: string; english?: boolean }[];
  perRowOnAPhone: number;
  on?: 'sheet' | 'coupon';
}) {
  const Group = on === 'sheet' ? 'nav' : 'div';
  return (
    <Group
      aria-label={label}
      role={on === 'sheet' ? undefined : 'group'}
      className={cn(
        'tear-off-line',
        on === 'sheet'
          ? '-mx-sheet-phone mt-8 -mb-10 md:-mx-sheet md:mt-12 md:-mb-sheet'
          : 'bg-coupon text-coupon-foreground [--half-ink:color-mix(in_srgb,var(--coupon-foreground)_60%,transparent)] [--ring:var(--coupon-foreground)]',
      )}
    >
      <ul
        className="grid grid-cols-[repeat(var(--per-row-on-a-phone),minmax(0,1fr))] md:grid-cols-[repeat(var(--tabs),minmax(0,1fr))]"
        style={
          { '--per-row-on-a-phone': perRowOnAPhone, '--tabs': tabs.length } as CSSProperties
        }
      >
        {tabs.map(({ address, name, english = false }, index) => (
          <li
            key={index}
            className={cn(
              'border-dashed border-half-ink',
              index % perRowOnAPhone !== 0 && 'border-s-2',
              index >= perRowOnAPhone && 'border-t-2 md:border-t-0',
              index !== 0 && index % perRowOnAPhone === 0 && 'md:border-s-2',
            )}
          >
            <a
              href={address}
              className="leans grid min-h-tab-phone place-items-center px-1 pt-3.5 pb-5.5 font-semibold select-none md:min-h-tab"
            >
              {english ? (
                <AlwaysEnglish className="reads-along-the-tab whitespace-nowrap">
                  {name}
                </AlwaysEnglish>
              ) : (
                <span className="reads-along-the-tab whitespace-nowrap">{name}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </Group>
  );
}
