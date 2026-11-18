import type {
  FulfilledPartRequestResponse,
  PartRequestWithVendorResponse,
} from '@pcp/api-client';
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { askAgainAfterAChangeToTheOffers } from '@/entities/offer';
import type { Resolution } from '@/entities/part-request';
import { apiClient, dataOf, partRequestsKey, partsKey, Refusal } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';

import type { Resolved } from '../model/resolution';

type Request = PartRequestWithVendorResponse;

// The request fulfilled, with what the fulfilment did to the Vendor's Offer
// for the Part, as the API answers it.
function fulfil(
  partRequestId: string,
  partId: string,
): Promise<FulfilledPartRequestResponse> {
  return dataOf(apiClient.fulfilPartRequest({ path: { partRequestId }, body: { partId } }));
}

// Whether the API refused because the request was already fulfilled or
// rejected, as from another tab: the screen then shows how it was resolved.
export function isResolvedAlready(error: unknown): boolean {
  return error instanceof Refusal && error.code === 'PART_REQUEST_RESOLVED';
}

// Asks again every query a fulfilment changes: every query about Part
// Requests, the queue, its count and the Vendor's own list among them; every
// query about the Vendor's Offers, through the Offers' own way, since a
// fulfilment makes, replaces or keeps one; and every query about Parts, so
// that Missing specifications and a search's mark of an Offer follow.
export async function askAgainAfterAFulfilment(
  queryClient: QueryClient,
  vendorId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: partRequestsKey }),
    askAgainAfterAChangeToTheOffers(queryClient, vendorId),
    queryClient.invalidateQueries({ queryKey: partsKey }),
  ]);
}

// Asks again every query about Part Requests, as after a rejection, which
// changes no Offer and no Part, or after a refusal that says the request was
// resolved meanwhile.
export async function askAgainAboutThePartRequests(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: partRequestsKey });
}

// Fulfils the request with a Part, found in the catalog or just created.
// Once it is done, `onFulfilled` leads the Admin on, and then every query it
// changed is asked again, so that the queue the Admin returns to is answered
// without the request, which leaves it as the Motion section says.
export function useFulfil(
  partRequest: Request,
  onFulfilled: (
    fulfilled: FulfilledPartRequestResponse,
    part: { id: string; name: string },
  ) => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (part: { id: string; name: string }) => fulfil(partRequest.id, part.id),
    onSuccess: async (fulfilled, part) => {
      await onFulfilled(fulfilled, part);
      await askAgainAfterAFulfilment(queryClient, partRequest.vendor.id);
    },
  });
}

// Rejects the request with a reason, then returns to the queue, with its
// note, and asks every query about Part Requests again.
export function useReject(partRequest: Request) {
  const queryClient = useQueryClient();
  const backToTheQueue = useBackToTheQueue(partRequest);
  return useMutation({
    mutationFn: (reason: string) =>
      dataOf(
        apiClient.rejectPartRequest({
          path: { partRequestId: partRequest.id },
          body: { reason },
        }),
      ),
    onSuccess: async () => {
      await backToTheQueue({ outcome: 'rejected' });
      await askAgainAboutThePartRequests(queryClient);
    },
  });
}

// What became of the request, as far as the Admin's own action says it:
// rejected, or fulfilled with a Part, with what that did to the Vendor's
// Offer.
type HowItWasResolved = DistributiveOmit<Resolution, 'requestName' | 'vendorName'>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// Returns to the queue, on the page it was on, with the note that names the
// request and says what became of it.
export function useBackToTheQueue(
  partRequest: Request,
): (how: HowItWasResolved) => Promise<void> {
  const navigate = useNavigate();
  const keepingTheQuery = useAddressKeepingTheQuery();
  return async (how) => {
    const state: Resolved = {
      resolved: {
        ...how,
        requestId: partRequest.id,
        requestName: partRequest.name,
        vendorName: partRequest.vendor.name,
      },
    };
    await navigate(keepingTheQuery('/part-requests'), { state });
  };
}
