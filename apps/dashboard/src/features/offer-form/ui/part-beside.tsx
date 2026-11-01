import type { PartSummaryResponse, SpecificationResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';

import { categoryName, labelOf, useCategories } from '@/entities/category';
import { PartNumbers, PartPicture, usePart, valueAt } from '@/entities/part';
import { useTranslation } from '@/shared/i18n';

// The Part an Offer is for, beside the Offer form from 64rem, on its end
// side, as the owner chose in redesign ticket 12 ("Part beside form") over a
// sheet left empty beside the form's 40rem column: on a Raised Stone panel
// with 8-pixel corners and no edge, its picture, its name at weight 550, one
// Note Grey line with its manufacturer and its Category, its part numbers in
// Geist Mono, and then its specifications, so that the Vendor knows it picked
// the right one. A specification is listed only when the Part holds a value
// for it, its label and its value English in every language (LANG-3), as a
// row of details: the label in Note Grey on the start side, the value beside
// it. The specifications arrive with the Part's own read, which the form for
// a new Offer has made already; until then the panel shows the rest.
export function PartBeside({ part }: { part: PartSummaryResponse }) {
  const { t } = useTranslation();
  const read = usePart(part.id);
  const categories = useCategories();
  const listed =
    categories.data
      ?.find(({ key }) => key === part.category)
      ?.specifications.map((specification) => ({
        specification,
        value: read.data
          ? valueAt(read.data.specifications, specification.path)
          : undefined,
      }))
      .filter(({ value }) => isKnown(value)) ?? [];

  return (
    <aside
      data-testid="offered-part"
      aria-labelledby="offered-part-name"
      className="flex min-w-0 flex-col gap-4 rounded-card bg-secondary p-4"
    >
      <div className="flex items-start gap-3">
        <PartPicture part={part} />
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          <p id="offered-part-name" className="font-[550]">
            <AlwaysEnglish data-testid="part-name" className="block w-fit max-w-full">
              {part.name}
            </AlwaysEnglish>
          </p>
          <p className="text-muted-foreground">
            <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
            {' · '}
            <span data-testid="category" data-category={part.category}>
              {categoryName(part.category)}
            </span>
          </p>
          <PartNumbers part={part} className="block w-fit max-w-full" />
        </div>
      </div>
      {listed.length > 0 && (
        <dl
          aria-label={t('OfferForm.specifications')}
          className="flex flex-col border-t border-rule text-sm"
        >
          {listed.map(({ specification, value }) => (
            <div
              key={specification.path}
              data-testid="part-specification"
              className="grid grid-cols-[2fr_3fr] gap-3 border-b border-rule py-2 last:border-b-0"
            >
              <dt className="text-muted-foreground">
                <AlwaysEnglish className="block w-fit max-w-full">
                  {labelOf(specification)}
                </AlwaysEnglish>
              </dt>
              <dd>
                <ValueOf specification={specification} value={value} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}

// Whether the Part holds a value for a specification: not left out, and not
// an empty list.
function isKnown(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  return !Array.isArray(value) || value.length > 0;
}

// A value inside a row, as text: a number grouped in Western digits, yes or
// no, or the values of a list.
function written(value: unknown): string {
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return Array.isArray(value) ? value.map(String).join(', ') : String(value);
}

// A specification's value by its kind: a number, yes or no in the portal's
// language, the values of a list, and a list of rows one to a line, each
// row's fields named and kept apart by a dot, in English as the
// specifications are. The unit is in the label.
function ValueOf({
  specification,
  value,
}: {
  specification: SpecificationResponse;
  value: unknown;
}) {
  const { t } = useTranslation();

  switch (specification.kind) {
    case 'wholeNumber':
    case 'decimalNumber':
      return (
        <AlwaysEnglish className="tabular-nums">
          {typeof value === 'number' ? formatNumber(value) : String(value)}
        </AlwaysEnglish>
      );
    case 'yesNo':
      return <>{value === true ? t('OfferForm.yes') : t('OfferForm.no')}</>;
    case 'severalOf':
    case 'listOfText':
      return (
        <AlwaysEnglish className="block w-fit max-w-full">
          {(value as unknown[]).map(String).join(', ')}
        </AlwaysEnglish>
      );
    case 'listOfRows':
      return (
        <span className="flex flex-col">
          {(value as Record<string, unknown>[]).map((row, index) => (
            <AlwaysEnglish key={index} className="block w-fit max-w-full">
              {(specification.fields ?? [])
                .filter((field) => isKnown(row[field.path]))
                .map((field) => `${labelOf(field)}: ${written(row[field.path])}`)
                .join(' · ')}
            </AlwaysEnglish>
          ))}
        </span>
      );
    default:
      return (
        <AlwaysEnglish className="block w-fit max-w-full">{String(value)}</AlwaysEnglish>
      );
  }
}
