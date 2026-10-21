import type { EditPartRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { categoryName, useCategories } from '@/entities/category';
import { partsKey, usePart } from '@/entities/part';
import { PartForm } from '@/features/part-form';
import { apiClient, dataOf, Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, BackLink, Button } from '@/shared/ui';

// The screen the form returns to: its address and its name, as the back
// link says it.
export interface ReturnTo {
  address: string;
  name: string;
}

// The form for correcting a Part, filled with the Part as it is. Saving
// replaces its name, manufacturer, part numbers and specifications with what
// the form holds, so a specification emptied in the form is cleared. Its
// Category is shown and cannot be changed: a Part in the wrong Category is
// created again in the right one.
//
// Opened from the Catalog, it leads back to the Part's page, and saving shows
// the Part. Opened from another list, such as the Missing specifications, it
// leads back to that list, and saving returns to it.
export function EditPartPage({ returnTo }: { returnTo?: ReturnTo }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { partId = '' } = useParams();
  const part = usePart(partId);
  const categories = useCategories();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const back = returnTo ?? { address: `/catalog/parts/${partId}`, name: 'The Part' };
  const edit = useMutation({
    mutationFn: (body: EditPartRequest) =>
      dataOf(apiClient.editPart({ path: { partId }, body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: partsKey });
      await navigate(keepingTheQuery(back.address));
    },
  });

  const error = part.error ?? categories.error;
  if (error) {
    const missing = error instanceof Refusal && error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery(returnTo?.address ?? '/catalog')}>
          {returnTo?.name ?? 'Catalog'}
        </BackLink>
        {/* A screen of its own, with a title that says what was not done
            (redesign ticket 08's break-ui). */}
        <h1 className="screen-title">
          {missing ? 'Part not found' : 'The Part could not be read'}
        </h1>
        {missing ? (
          <p>The catalog holds no Part at this address.</p>
        ) : (
          <>
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
          </>
        )}
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
      <BackLink to={keepingTheQuery(back.address)}>{back.name}</BackLink>
      <h1 className="screen-title">Edit the Part</h1>
      {/* The Part's name is the form's first field, so it is not said again
          here, where a long one pushed the form down (break-ui). */}
      <p className="text-muted-foreground">
        Category: <span data-testid="category">{categoryName(category.key)}</span>. A Part's
        Category cannot be changed.
      </p>
      <PartForm
        category={category}
        part={part.data}
        submitLabel="Save the Part"
        busyLabel="Saving the Part…"
        save={(fields) => edit.mutateAsync(fields)}
      />
    </div>
  );
}
