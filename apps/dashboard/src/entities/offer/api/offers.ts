import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, dataOf } from '@/shared/api';

// Every query about a Vendor's Offers is under this key: its list, a page of
// it, a search of it and its counts, which the banner reads. So any change to
// one of the Vendor's Offers, and confirming them all, asks every one of
// them again.
export function vendorsOffersKey(vendorId: string) {
  return ['offers', vendorId] as const;
}

// How many Offers a page of the list holds: a phone's screen of rows and a
// little more, as a page of the Catalog's results holds.
export const pageSize = 20;

// A search of a Vendor's own Offers: the words typed, which a Part's name,
// manufacturer or part number holds, and the page, counted from 0 as the API
// counts it.
export interface OffersSearch {
  words: string;
  page: number;
}

// One page of a Vendor's Offers, Expired Offers among them, oldest
// Confirmation first, with the Vendor's counts of all its Offers, whatever
// the search. While the next page or the next search is on its way, the last
// answer stays on screen.
export function useVendorsOffers(vendorId: string, { words, page }: OffersSearch) {
  const search = words.trim();

  return useQuery({
    queryKey: [...vendorsOffersKey(vendorId), 'list', { search, page }],
    queryFn: () =>
      dataOf(
        apiClient.listVendorsOffers({
          path: { vendorId },
          query: { page, size: pageSize, ...(search === '' ? {} : { search }) },
        }),
      ),
    // Another Vendor's last answer is never shown in its place, as when the
    // Admin acts as one Vendor after another.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === vendorId ? keepPreviousData(previous) : undefined,
  });
}
