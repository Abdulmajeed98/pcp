import type { PartSummaryResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';

import { categoryName } from '@/entities/category';
import { Trans } from '@/shared/i18n';

// A row's number in the file, "Row 18", at weight 550 in tabular figures.
export function RowNumber({ row }: { row: number }) {
  return (
    <p data-testid="row-number" className="font-[550] tabular-nums">
      <Trans
        i18nKey="OfferSheetScreen.row"
        components={{ row: <>{formatNumber(row)}</> }}
      />
    </p>
  );
}

// A Part as the catalog search names it: its name `AlwaysEnglish` at weight
// 550, and one Note Grey line with its manufacturer and its Category, each
// English text starting on the line's start side.
export function PartLine({ part }: { part: PartSummaryResponse }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="font-[550]">
        <AlwaysEnglish data-testid="part-name">{part.name}</AlwaysEnglish>
      </span>
      <span className="text-muted-foreground">
        <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish> · {categoryName(part.category)}
      </span>
    </span>
  );
}
