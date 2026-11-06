import { cn } from 'cn';
import type { CSSProperties } from 'react';

// Tear-off tabs (DESIGN.md's Tear-off tabs): the foot of a sheet cut into
// tabs along a perforation, each a link, its words read upright along the
// tab. A tab is at least 44 pixels wide and 150 pixels tall, 130 on a phone,
// where they take rows of `perRowOnAPhone`. They are listed in the reading
// order, and so mirror in Kurdish and Arabic. Their perforations are dashed
// in Half Ink, 3 pixels along their top and 2 between them. A tab leans from
// its perforation under the pointer and when pressed (Motion 5), and its
// words are not selected under a resting thumb.
//
// They run to the edges of the sheet they end, through its padding, so the
// sheet's own cut edge is their foot.
export function TearOffTabs({
  label,
  tabs,
  perRowOnAPhone,
}: {
  label: string;
  tabs: readonly { address: string; name: string }[];
  perRowOnAPhone: number;
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-sheet-phone mt-8 -mb-10 tear-off-line md:-mx-sheet md:mt-12 md:-mb-sheet"
    >
      <ul
        className="grid grid-cols-[repeat(var(--per-row-on-a-phone),minmax(0,1fr))] md:grid-cols-[repeat(var(--tabs),minmax(0,1fr))]"
        style={
          { '--per-row-on-a-phone': perRowOnAPhone, '--tabs': tabs.length } as CSSProperties
        }
      >
        {tabs.map(({ address, name }, index) => (
          <li
            key={address}
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
              <span className="reads-along-the-tab whitespace-nowrap">{name}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
