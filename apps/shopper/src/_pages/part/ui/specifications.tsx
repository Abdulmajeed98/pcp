import type { VisiblePartWithSpecificationsResponse } from '@pcp/api-client';
import { getTranslations } from 'next-intl/server';

import { BoxLabel, SpecificationList } from '@/entities/part';
import { photographs } from '@/shared/photographs';
import { DimPhotograph } from '@/shared/ui';

// A Part's specifications (DESIGN.md's The specifications), over a dim
// photograph of memory chips: one wide panel of Sheet Paper, at most 72rem,
// the one piece framed, in a 3-pixel frame of the Ink, as the label on a box
// is. Its title, then the box label, then every specification the Part holds
// in its Category's order, in English (LANG-3). A Part the catalog holds no
// specification of says so, rather than showing an empty list. The panel
// holds still: it does not print (What stays still).
export async function Specifications({
  part,
}: {
  part: VisiblePartWithSpecificationsResponse;
}) {
  const t = await getTranslations('PartPage');

  return (
    <section
      aria-labelledby="specifications-title"
      className="relative isolate px-ground-edge py-section-phone md:page-margins md:py-section"
    >
      <DimPhotograph photograph={photographs.memoryChips} />
      <div
        data-testid="specifications-panel"
        className="mx-auto w-full max-w-[72rem] border-[3px] border-foreground bg-card px-sheet-phone py-10 text-card-foreground md:p-sheet"
      >
        <h2 id="specifications-title" className="type-sheet-title">
          {t('specifications')}
        </h2>
        <div className="mt-8">
          <BoxLabel part={part} />
        </div>
        {part.specifications.length > 0 ? (
          <SpecificationList specifications={part.specifications} />
        ) : (
          <p data-testid="no-specifications" className="mt-8 text-lg">
            {t('noSpecifications')}
          </p>
        )}
      </div>
    </section>
  );
}
