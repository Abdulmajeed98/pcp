import type { VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildAddress, type BuildPart, isKitOrDrive } from '@/entities/build';
import { partAddress, PartSquare } from '@/entities/part';
import { PickForm } from '@/features/change-the-build';
import { ShownPrice } from '@/shared/price';
import { Item, whereAPartsNameStands } from '@/shared/ui';

// A Part in the picker (DESIGN.md's A Part in the picker): an item as on a
// Category page, its photo or its Category's icon in the small square, its
// name in English as a link to its Part page (LANG-3), the leader, its
// Lowest Price at the end, drawn by the Shown Price, and its second line,
// its manufacturer and how many Vendors offer it. A long name keeps the
// Long Name Rule.
//
// Under the line, from the start of its words (from the start of the line
// once the line stacks, the theme's `data-controls` rule), its pick control
// at the end: Pick, the pick form's cell. The Part the Build already holds
// says "In your Build" at 600 with the tick mark at the start of the row, in
// place of Pick; a RAM kit or a drive the Build holds says how many, "In
// your Build, 2 ×", and offers Add one more at the end, which counts it once
// more. With the switch on, a Part that is not Compatible with the Build
// begins its second line with "✕ Does not fit your Build" at 600 in the
// Ink, in words as well as its mark, and can still be picked; the Build page
// then says why. The ✕ is drawn, as the rules' sheet draws its marks, since
// the character is read as an emoji (Taste's inspector, `emoji`).
export async function PickerPart({
  part,
  place,
  held,
}: {
  part: VisiblePartResponse;
  // The item's place on its sheet, from 0, which staggers its price as the
  // sheet prints (Motion 2).
  place: number;
  // The Build's own entry for this Part, when it holds it.
  held: BuildPart | undefined;
}) {
  const [language, t, partWords] = await Promise.all([
    getLocale(),
    getTranslations('PickerPage'),
    getTranslations('Part'),
  ]);
  const notFit = part.compatible === false;
  const canPick = held === undefined || isKitOrDrive(part.category);

  return (
    <li
      data-testid="picker-part"
      data-part={part.id}
      data-in-build={
        held === undefined ? undefined : 'quantity' in held ? String(held.quantity) : 'one'
      }
      data-not-fit={notFit ? '' : undefined}
      className="@container grid grid-cols-[minmax(0,1fr)] gap-1"
    >
      <ul className="@container grid grid-cols-[minmax(0,1fr)]">
        <Item
          testId="visible-part"
          data={{ 'data-part': part.id }}
          place={place}
          nameAlone={whereAPartsNameStands(part.name)}
          picture={<PartSquare part={part} />}
          name={
            <a href={partAddress(language, part.id)} className="hover-underline">
              <AlwaysEnglish>{part.name}</AlwaysEnglish>
            </a>
          }
          end={
            part.lowestPrice === null ? undefined : <ShownPrice price={part.lowestPrice} />
          }
          second={
            <>
              {notFit && (
                <>
                  <span
                    data-testid="does-not-fit"
                    className="font-semibold text-foreground"
                  >
                    <Cross />
                    {t('doesNotFit')}
                  </span>
                  {' · '}
                </>
              )}
              <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
              {' · '}
              {partWords('vendors', {
                count: part.vendorCount,
                countText: formatNumber(part.vendorCount),
              })}
            </>
          }
        />
      </ul>
      <div
        data-controls=""
        className="flex flex-wrap items-center justify-between gap-2 ps-[3.25rem] md:ps-[3.75rem]"
      >
        {held === undefined ? (
          <span />
        ) : (
          <span
            data-testid="in-your-build"
            className="inline-flex min-h-control max-w-full items-center gap-2 text-base font-semibold"
          >
            <TickMark />
            <span className="min-w-0 wrap-break-word">
              {'quantity' in held
                ? t('inYourBuildTimes', { quantity: formatNumber(held.quantity) })
                : t('inYourBuild')}
            </span>
          </span>
        )}
        {canPick && (
          <PickForm
            action={`${buildAddress(language)}/pick`}
            category={part.category}
            part={part.id}
            label={
              held === undefined
                ? t('pickIt', { part: part.name })
                : t('addOneMoreOf', { part: part.name })
            }
          >
            {held === undefined ? t('pick') : t('addOneMore')}
          </PickForm>
        )}
      </div>
    </li>
  );
}

// The ✕ before "Does not fit your Build": two strokes in the Ink, three
// quarters of the line's text tall, on its baseline, hidden from readers,
// since the words beside it say the same. It reads the same in every
// direction.
function Cross() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      data-testid="cross"
      className="me-[0.35em] inline size-[0.75em] align-baseline"
    >
      <path d="M2 2 L10 10 M10 2 L2 10" fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

// The tick mark beside "In your Build": a square of the Ink with a tick in
// the paper's colour, 20 pixels, hidden from readers, since the words beside
// it say the same.
function TickMark() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      <rect width="20" height="20" fill="currentColor" />
      <path
        d="M5 10.5 L8.2 13.7 L15 6.8"
        fill="none"
        stroke="var(--card)"
        strokeWidth={2.4}
      />
    </svg>
  );
}
