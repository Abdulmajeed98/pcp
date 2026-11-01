import type { CategoryResponse, PartResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { CircleAlertIcon, PencilIcon } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { PartPicture, usePart, valueAt } from '@/entities/part';
import { PhotoField } from '@/features/add-photo';
import { Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  BackLink,
  Button,
  buttonVariants,
  ScreenTitle,
  SectionTitle,
} from '@/shared/ui';

import { DetailRow, DetailRows, PartNumbers } from './detail-rows';
import { NeededNotKnown, NotKnown, SpecificationValue } from './specification-value';

// The day a Part last changed, in English, with Western digits.
const day = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  numberingSystem: 'latn',
});

// A Part's page, as the dashboard's DESIGN.md lays it out (redesign ticket
// 08): everything the platform holds about it. At its head, its picture, its
// name in the Title type, its manufacturer and Category, and in words which
// needed specifications it lacks, never on a plate, since plates are for
// prices; then the ways to edit it and to add its photo. Then its part
// numbers, where it came from and when it last changed, and every
// specification of its Category's list under its English label, each a row
// divided by Rule lines, the missing ones said to be so and the missing
// needed ones marked in Action Red.
export function PartPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { partId = '' } = useParams();
  const part = usePart(partId);
  const categories = useCategories();

  if (part.error instanceof Refusal && part.error.status === 404) return <PartNotFound />;
  const error = part.error ?? categories.error;
  // A Part the API does not give is a screen of its own: its title says
  // what was not done, the refusal panel why, and the Admin may try again
  // (redesign ticket 08's break-ui).
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
        <ScreenTitle className="text-xl/snug font-[650]">
          The Part could not be read
        </ScreenTitle>
        <Alert variant="destructive" data-testid="refusal">
          <AlertDescription>
            <WhyNotAnswered error={error} />
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            void part.refetch();
            void categories.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (part.data === undefined || categories.data === undefined) {
    return <p className="text-sm text-muted-foreground">Reading the Part…</p>;
  }

  const category = categories.data.find(({ key }) => key === part.data.category);
  if (category === undefined) return null;

  return <PartDetails part={part.data} category={category} />;
}

function PartDetails({
  part,
  category,
}: {
  part: PartResponse;
  category: CategoryResponse;
}) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const missing = part.missingNeededSpecifications;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
        <div className="flex items-start gap-4">
          {/* A photo added while the page is open comes in smoothly, and
              the page itself never fades in; another Part is another
              picture. */}
          <PartPicture key={part.id} part={part} size="page" />
          <div className="flex min-w-0 flex-col gap-1">
            <ScreenTitle className="text-xl/snug font-[650] wrap-break-word">
              <AlwaysEnglish>{part.name}</AlwaysEnglish>
            </ScreenTitle>
            <p className="text-sm text-muted-foreground">
              <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish> ·{' '}
              {categoryName(part.category)}
            </p>
          </div>
        </div>
        <Lacks part={part} category={category} />
        <div className="flex flex-wrap items-start gap-2">
          <Link
            to={keepingTheQuery(`/catalog/parts/${part.id}/edit`)}
            className={buttonVariants({ variant: 'outline' })}
          >
            <PencilIcon data-icon="inline-start" aria-hidden="true" />
            Edit
          </Link>
          <PhotoField partId={part.id} hasPhoto={part.photoPath !== null} />
        </div>
      </div>

      <DetailRows label="About the Part">
        <DetailRow name="Part numbers">
          {part.partNumbers.length > 0 ? (
            <PartNumbers partNumbers={part.partNumbers} />
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </DetailRow>
        <DetailRow name="Source">
          {part.openDbId === null ? (
            'Created by the Admin'
          ) : (
            <>
              From OpenDB, as{' '}
              <AlwaysEnglish className="font-mono break-all">{part.openDbId}</AlwaysEnglish>
            </>
          )}
        </DetailRow>
        <DetailRow name="Last changed">{day.format(new Date(part.updatedAt))}</DetailRow>
      </DetailRows>

      <section aria-labelledby="specifications" className="flex flex-col gap-2">
        <SectionTitle id="specifications" className="text-base font-semibold">
          Specifications
        </SectionTitle>
        <dl className="divide-y divide-rule border-y border-rule text-sm">
          {category.specifications.map((specification) => {
            const value = valueAt(part.specifications, specification.path);
            const wide = specification.kind === 'listOfRows' && value !== undefined;
            return (
              <div
                key={specification.path}
                data-specification={specification.path}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 py-3.5"
              >
                <dt className="text-muted-foreground">{specification.label}</dt>
                <dd className={wide ? 'col-span-2' : 'min-w-0 wrap-break-word'}>
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

// Which needed specifications the Part lacks, by their labels, in Action Red
// after a circled exclamation mark, as a Part missing specifications says it;
// and nothing when it lacks none (the owner's word on 22 October 2026, "Say
// nothing").
function Lacks({ part, category }: { part: PartResponse; category: CategoryResponse }) {
  const missing = part.missingNeededSpecifications;
  if (missing.length === 0) return null;

  const labels = category.specifications
    .filter(({ path }) => missing.includes(path))
    .map(({ label }) => label);
  return (
    <p className="flex items-start gap-1.5 text-sm font-[550] text-destructive">
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span data-testid="lacks">Lacks {labels.join(', ')}</span>
    </p>
  );
}

function PartNotFound() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
      <ScreenTitle className="text-xl/snug font-[650]">Part not found</ScreenTitle>
      <p>The catalog holds no Part at this address. It may never have existed.</p>
    </div>
  );
}
