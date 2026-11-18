import type { SendPartRequestRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';

import type { CategoryKey } from '@/entities/category';
import { useVendorShown } from '@/entities/vendor';
import {
  PartRequestForm,
  partRequestFormValues,
  type SearchedFor,
  type SentPartRequest,
  WhatHappensNext,
} from '@/features/part-request-form';
import { apiClient, dataOf, partRequestsKey } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { queryOfWordsAndCategory, wordsAndCategoryIn } from '@/shared/lib';
import { BackLink } from '@/shared/ui';

// The Vendor portal's Part Request form, `part-requests/new` below the
// Vendor's Part Requests (REQ-1). A Vendor opens it from the section at any
// time, and from a catalog search that found nothing, whose words and
// Category its address carries, `part-requests/new?search=…&category=…`, so
// that a reload keeps them: the words start the form as the Part's name, and
// the Category as its Category, and the Vendor corrects either before
// sending.
//
// As the dashboard's DESIGN.md lays it out (the owner's d4, taken under the
// standing instruction of 18 November 2026): a back link, "Back to the
// search" when it was opened from the search and "Your Part Requests"
// otherwise, its title and one Note Grey sentence; then the form, in one
// column at most 40rem wide, and from 64rem, on its end side, level with
// its head, the panel that says what happens next, on Raised Stone, so that
// the sheet beside the form is not left empty, as the Offer form's Part
// beside it is not. On a phone the panel follows the form. The form's
// column stays where it is at every width, so that a window crossing 64rem
// leaves what is typed in it as it is.
//
// After a send every query about Part Requests is asked again, and the
// screen returns to the Vendor's Part Requests, with the request in the
// address's state for the list's note. Every way it leads is written
// relative to its route, so that it serves the portal's own frame and the
// frame of the Admin acting as the Vendor alike.
export function NewPartRequestPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const searchedFor = searchedForIn(useSearchParams()[0]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const send = useMutation({
    mutationFn: (body: SendPartRequestRequest) =>
      dataOf(apiClient.sendPartRequest({ path: { vendorId }, body })),
    onSuccess: async (sent) => {
      await queryClient.invalidateQueries({
        queryKey: partRequestsKey,
        refetchType: 'all',
      });
      await navigate('..', {
        state: { sent: { id: sent.id, name: sent.name } } satisfies SentPartRequest,
      });
    },
  });

  return (
    <div data-testid="new-part-request" className="flex min-w-0 flex-col gap-4">
      {searchedFor === undefined ? (
        <BackLink to="..">{t('NewPartRequest.backToTheList')}</BackLink>
      ) : (
        <BackLink
          to={{ pathname: '../../add', search: queryOfWordsAndCategory(searchedFor) }}
        >
          {t('NewPartRequest.backToTheSearch')}
        </BackLink>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="screen-title">{t('NewPartRequest.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('NewPartRequest.intro')}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(16rem,1fr)]">
        <PartRequestForm
          values={partRequestFormValues({
            name: searchedFor?.words,
            category: searchedFor?.category,
          })}
          searchedFor={searchedFor}
          save={(body) => send.mutateAsync(body)}
        />
        <WhatHappensNext />
      </div>
    </div>
  );
}

// The search the address carries, when the form was opened from one: its
// words, and its Category if one narrowed it, as the catalog search writes
// them, so that the way back returns to the search as it was.
function searchedForIn(params: URLSearchParams): SearchedFor | undefined {
  const { words, category } = wordsAndCategoryIn<CategoryKey>(params);
  return words.trim() === '' ? undefined : { words: words.trim(), category };
}
