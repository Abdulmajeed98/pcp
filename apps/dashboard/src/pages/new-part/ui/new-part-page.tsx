import type { CreatePartRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { partsKey } from '@/entities/part';
import { PartForm } from '@/features/part-form';
import { apiClient, dataOf, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// The form for a new Part of the Category the address names. Saving creates
// the Part and opens its page, and the next search finds it.
export function NewPartPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { category: key } = useParams();
  const categories = useCategories();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (body: CreatePartRequest) => dataOf(apiClient.createPart({ body })),
    onSuccess: async (part) => {
      await queryClient.invalidateQueries({ queryKey: partsKey });
      await navigate(keepingTheQuery(`/catalog/parts/${part.id}`));
    },
  });

  if (categories.error) {
    return (
      <Alert variant="destructive" data-testid="refusal">
        <AlertTitle>The Categories could not be read.</AlertTitle>
        <AlertDescription>
          <WhyNotAnswered error={categories.error} />
        </AlertDescription>
      </Alert>
    );
  }
  if (categories.data === undefined) return null;

  const category = categories.data.find((each) => each.key === key);
  if (category === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/catalog/new')}>Choose a Category</BackLink>
        <h1 className="text-xl font-semibold sm:text-2xl">Category not found</h1>
        <p>The catalog has no Category of that name.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/catalog/new')}>Choose another Category</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">
        New {categoryName(category.key)}
      </h1>
      <PartForm
        category={category}
        submitLabel="Create the Part"
        save={(fields) => create.mutateAsync({ ...fields, category: category.key })}
      />
    </div>
  );
}
