import type { VisiblePartWithSpecificationsResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { getTranslations } from 'next-intl/server';

import { Barcode } from '@/shared/barcode';
import { CategoryDrawing, nameTypeOnANarrowPiece } from '@/shared/ui';

import { keyLinesOf } from '../model/key-lines';
import { specificationText } from '../model/specification-text';

// The box label (DESIGN.md's The specifications): the label on a Part's box,
// which opens its specifications. On its start side the Part's name, in the
// Sheet title or the Long Name Rule's smaller sizes, and on a label narrower
// than 12em of its text, which only a phone's largest text makes, as on the
// plate, the Facts size (the start side is the container `piece`, the owner's
// choice of 16 November 2026, follow-up ticket 13), then its key lines, each
// a label in Body at the start and its value at 600, in English and left to
// right, parted by 2-pixel rules at a quarter of the Ink, and on a label
// narrower than 12em of its text each key line stacked, its value under its
// label, since the label's 9rem then leaves the value no room (follow-up
// ticket 13); on its end side,
// from 64rem, in a column of 24rem, as wide as the barcode of a part number
// of twenty characters at a pixel a module, the drawing of its Category and
// its first part number as a Code 39 barcode, named for a screen reader by
// the part number; below 64rem they follow the lines. A 3-pixel rule in the
// Ink lies under it. A Part with no part number has no barcode.
export async function BoxLabel({
  part,
}: {
  part: Pick<
    VisiblePartWithSpecificationsResponse,
    'name' | 'category' | 'partNumbers' | 'specifications'
  >;
}) {
  const t = await getTranslations('PartPage');
  const lines = keyLinesOf(part);
  const [partNumber] = part.partNumbers;

  return (
    <div
      data-testid="box-label"
      className="grid gap-x-10 gap-y-8 border-b-[3px] border-foreground pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
    >
      <div className="@container/piece min-w-0">
        <p lang="en" className={cn('wrap-break-word', nameTypeOnANarrowPiece(part.name))}>
          <AlwaysEnglish>{part.name}</AlwaysEnglish>
        </p>
        {lines.length > 0 && (
          <dl className="mt-6 grid">
            {lines.map((line) => (
              <div
                key={line.path}
                data-testid="key-line"
                data-specification={line.path}
                className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 border-t-2 border-[color-mix(in_srgb,var(--foreground)_25%,transparent)] py-2.5 first:border-t-0 @max-[12em]/piece:grid-cols-1"
              >
                <dt className="wrap-break-word">
                  <AlwaysEnglish>{line.label}</AlwaysEnglish>
                </dt>
                <dd className="font-semibold wrap-break-word">
                  {specificationText(line).map((text, place) => (
                    <span key={place} className="block">
                      <AlwaysEnglish>{text}</AlwaysEnglish>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="grid content-start justify-items-center gap-6">
        <CategoryDrawing category={part.category} className="mt-0 w-[min(100%,15rem)]" />
        {partNumber !== undefined && (
          <Barcode text={partNumber} label={t('barcode', { number: partNumber })} />
        )}
      </div>
    </div>
  );
}
