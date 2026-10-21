import type { CategoryResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { CategoryIcon } from '@pcp/ui';
import { ChevronRightIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle, BackLink, SketchedRows } from '@/shared/ui';

// The first step of a new Part: its Category, chosen from the eight. The
// Category decides which specifications the form asks for, and it cannot be
// changed once the Part exists. The Categories are the API's, so a refusal
// to give them is said in words.
//
// As the dashboard's DESIGN.md lays out a list (redesign ticket 08): two-line
// rows divided by Rule lines, the Category's icon plain in Note Grey, its
// name in the Row type, and on the second line what its form will ask, "29
// specifications, 3 needed", so that the Admin knows the work before
// choosing; the whole row is the link, with a Raised Stone ground under the
// pointer.
export function ChooseCategoryPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const categories = useCategories();

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
      <h1 className="screen-title">New Part</h1>
      <p className="text-muted-foreground">
        Choose its Category first. The form then asks for that Category's specifications,
        and the Category cannot be changed once the Part exists.
      </p>
      {categories.error && (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Categories could not be read.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={categories.error} />
          </AlertDescription>
        </Alert>
      )}
      {categories.isPending && (
        <SketchedRows
          words="Reading the Categories…"
          rowClassName="flex min-h-18 flex-col justify-center gap-2 py-3"
        >
          <span className="h-3.5 w-1/4 rounded-sm bg-secondary" />
          <span className="h-3.5 w-1/2 rounded-sm bg-muted" />
        </SketchedRows>
      )}
      {categories.data !== undefined && (
        <ul
          aria-label="Categories"
          className="-mx-2 divide-y divide-rule border-y border-rule"
        >
          {categories.data.map((category) => (
            <li key={category.key}>
              <CategoryRow category={category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({ category }: { category: CategoryResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const needed = category.specifications.filter((specification) => specification.needed);

  return (
    <div className="hover-colour relative flex min-h-18 items-center gap-3 px-2 py-3 hover:bg-secondary">
      <CategoryIcon
        category={category.key}
        className="size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <Link
          to={keepingTheQuery(`/catalog/new/${category.key}`)}
          className="font-[550] after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
        >
          {categoryName(category.key)}
        </Link>
        <p className="text-muted-foreground">
          {formatNumber(category.specifications.length)} specifications,{' '}
          {formatNumber(needed.length)} needed
        </p>
      </div>
      <ChevronRightIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
      />
    </div>
  );
}
