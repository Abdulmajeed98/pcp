import { CategoryIcon } from '@pcp/ui';
import { ChevronRightIcon } from 'lucide-react';
import { Link } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BackLink,
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '@/shared/ui';

// The first step of a new Part: its Category, chosen from the eight, each
// with its icon. The Category decides which specifications the form asks
// for, and it cannot be changed once the Part exists. The Categories are the
// API's, so a refusal to give them is said in words.
export function ChooseCategoryPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const categories = useCategories();

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">New Part</h1>
      <p>
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
        <p className="text-sm text-muted-foreground">Reading the Categories…</p>
      )}
      {categories.data !== undefined && (
        <ul
          aria-label="Categories"
          className="divide-y divide-border border-y border-border"
        >
          {categories.data.map(({ key }) => (
            <li key={key}>
              <Item className="relative rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2">
                <ItemMedia variant="icon">
                  <CategoryIcon category={key} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-base">
                    <Link
                      to={keepingTheQuery(`/catalog/new/${key}`)}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {categoryName(key)}
                    </Link>
                  </ItemTitle>
                </ItemContent>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground rtl:rotate-180"
                />
              </Item>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
