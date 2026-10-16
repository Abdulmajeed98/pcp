import type { CategoryResponse, PartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { PartPicture, usePart, valueAt } from '@/entities/part';
import { Refusal, WhyNotAnswered } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, BackLink, Plate } from '@/shared/ui';

import { NeededNotKnown, NotKnown, SpecificationValue } from './specification-value';

// The day a Part last changed, in English, with Western digits.
const day = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  numberingSystem: 'latn',
});

// A Part's page: everything the platform holds about it. Its picture, name,
// manufacturer and Category; its part numbers; where it came from; how many
// of its needed specifications it lacks, on the screen's one plate; and every
// specification of its Category's list under its English label, the missing
// ones said to be so, and the missing needed ones marked.
export function PartPage() {
  const { partId = '' } = useParams();
  const part = usePart(partId);
  const categories = useCategories();

  if (part.error instanceof Refusal && part.error.status === 404) return <PartNotFound />;
  const error = part.error ?? categories.error;
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/catalog">Catalog</BackLink>
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Part could not be read.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={error} />
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (part.data === undefined || categories.data === undefined) {
    return <p className="text-sm text-muted-foreground">Reading the Part…</p>;
  }

  const category = categories.data.find(({ key }) => key === part.data.category);
  if (category === undefined) return null;

  return <ThePart part={part.data} category={category} />;
}

function ThePart({ part, category }: { part: PartResponse; category: CategoryResponse }) {
  const missing = part.missingNeededSpecifications;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink to="/catalog">Catalog</BackLink>
        <div className="flex items-start gap-4">
          <PartPicture part={part} size="page" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-xl font-semibold sm:text-2xl">
              <AlwaysEnglish>{part.name}</AlwaysEnglish>
            </h1>
            <p className="text-sm text-muted-foreground">
              <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish> ·{' '}
              {categoryName(part.category)}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Part numbers</dt>
        <dd>
          {part.partNumbers.length > 0 ? (
            <AlwaysEnglish>{part.partNumbers.join(', ')}</AlwaysEnglish>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </dd>
        <dt className="text-muted-foreground">Source</dt>
        <dd>
          {part.openDbId === null ? (
            'Created by the Admin'
          ) : (
            <>
              From OpenDB, as <AlwaysEnglish>{part.openDbId}</AlwaysEnglish>
            </>
          )}
        </dd>
        <dt className="text-muted-foreground">Last changed</dt>
        <dd>{day.format(new Date(part.updatedAt))}</dd>
      </dl>

      {missing.length > 0 ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Plate data-testid="missing-needed-count">{formatNumber(missing.length)}</Plate>
          {missing.length === 1
            ? 'needed specification is not known'
            : 'needed specifications are not known'}
        </p>
      ) : (
        <p>Every needed specification is known.</p>
      )}

      <section aria-labelledby="specifications" className="flex flex-col gap-2">
        <h2 id="specifications" className="text-lg font-semibold">
          Specifications
        </h2>
        <dl className="divide-y divide-border border-y border-border text-sm">
          {category.specifications.map((specification) => {
            const value = valueAt(part.specifications, specification.path);
            const wide = specification.kind === 'listOfRows';
            return (
              <div
                key={specification.path}
                data-specification={specification.path}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-1 py-2.5"
              >
                <dt className="text-muted-foreground">{specification.label}</dt>
                <dd className={wide && value !== undefined ? 'col-span-2' : undefined}>
                  {missing.includes(specification.path) ? (
                    <NeededNotKnown />
                  ) : value === undefined ? (
                    <NotKnown />
                  ) : (
                    <SpecificationValue specification={specification} value={value} />
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}

function PartNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/catalog">Catalog</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">Part not found</h1>
      <p>The catalog holds no Part at this address. It may never have existed.</p>
    </div>
  );
}
