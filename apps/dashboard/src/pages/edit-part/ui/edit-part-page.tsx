import type { EditPartRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { partsKey, usePart } from '@/entities/part';
import { PartForm } from '@/features/part-form';
import { apiClient, dataOf, Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// The form for correcting a Part, filled with the Part as it is. Saving
// replaces its name, manufacturer, part numbers and specifications with what
// the form holds, so a specification emptied in the form is cleared. Its
// Category is shown and cannot be changed: a Part in the wrong Category is
// created again in the right one.
export function EditPartPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { partId = '' } = useParams();
  const part = usePart(partId);
  const categories = useCategories();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const edit = useMutation({
    mutationFn: (body: EditPartRequest) =>
      dataOf(apiClient.editPart({ path: { partId }, body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: partsKey });
      await navigate(keepingTheQuery(`/catalog/parts/${partId}`));
    },
  });

  const error = part.error ?? categories.error;
  if (error) {
    const missing = error instanceof Refusal && error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/catalog')}>Catalog</BackLink>
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>
            {missing ? 'Part not found.' : 'The Part could not be read.'}
          </AlertTitle>
          <AlertDescription>
            {missing ? (
              'The catalog holds no Part at this address.'
            ) : (
              <WhyNotAnswered error={error} />
            )}
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

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery(`/catalog/parts/${partId}`)}>The Part</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">Edit the Part</h1>
      <p>
        Category: <span data-testid="category">{categoryName(category.key)}</span>. A Part's
        Category cannot be changed.
      </p>
      <PartForm
        category={category}
        part={part.data}
        submitLabel="Save the Part"
        save={(fields) => edit.mutateAsync(fields)}
      />
    </div>
  );
}
