import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, dataOf, partRequestsKey, partsKey } from '@/shared/api';

// How many Part Requests a page of the queue holds, as a page of the
// Catalog's results holds.
export const pageSize = 20;

// The queue's key, under the key of every query about Part Requests, so that
// a fulfilment or a rejection asks it again and the resolved request leaves.
const queueKey = [...partRequestsKey, 'open'] as const;

// One page of the open Part Requests of every Vendor, active and
// deactivated, the oldest first, as the API orders them, each with its
// Vendor. While the next page is on its way, the last one stays on screen.
export function useOpenPartRequests(page: number) {
  return useQuery({
    queryKey: [...queueKey, { page }],
    queryFn: () =>
      dataOf(apiClient.listOpenPartRequests({ query: { page, size: pageSize } })),
    placeholderData: keepPreviousData,
  });
}

// The key of one Part Request, under the key of them all.
export function partRequestKey(partRequestId: string) {
  return [...partRequestsKey, 'one', partRequestId] as const;
}

// One Part Request in any state, with its Vendor.
export function usePartRequest(partRequestId: string) {
  return useQuery({
    queryKey: partRequestKey(partRequestId),
    queryFn: () => dataOf(apiClient.readPartRequest({ path: { partRequestId } })),
  });
}

// How many Parts a page of the match search holds.
export const matchesOnAPage = 20;

// One page of the Parts a search of the whole catalog finds, in name order,
// each with the request's Vendor's Offer for it when it has one, so that the
// Admin sees what matching would do. It is a query about Parts, under the
// Parts' key, so that a change to any Part, or to an Offer a fulfilment
// makes, asks it again. While the next page or search is on its way, the
// last answer stays.
export function useMatchSearch(vendorId: string, words: string, page: number) {
  const search = words.trim();
  return useQuery({
    queryKey: [...partsKey, 'matching', vendorId, { search, page }],
    queryFn: () =>
      dataOf(
        apiClient.searchParts({
          query: {
            vendorId,
            page,
            size: matchesOnAPage,
            ...(search === '' ? {} : { search }),
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}
