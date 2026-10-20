import {
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useQuery,
} from '@tanstack/react-query';

import { apiClient, dataOf, partsKey, vendorsKey } from '@/shared/api';

// Every query about a Vendor's Offers is under this key: its list, a page of
// it, a search of it and its counts, which the banner reads. So any change to
// one of the Vendor's Offers, and confirming them all, asks every one of
// them again.
export function vendorsOffersKey(vendorId: string) {
  return ['offers', vendorId] as const;
}

// The catalog search of the Vendor portal, for one Vendor. It is a query about
// Parts, so it is under the Parts' key, as every query about Parts is, and an
// Admin's change to a Part asks it again. It also marks the Parts the Vendor
// offers, so a change to the Vendor's Offers asks it again too.
export function vendorsCatalogSearchKey(vendorId: string) {
  return [...partsKey, 'offered-by', vendorId] as const;
}

// The Admin console's Missing specifications, which lists the Parts that have
// an Offer, with how many: a query about Parts, which a change to any Offer
// changes.
export const missingSpecificationsKey = [...partsKey, 'missing-specifications'] as const;

// The Admin console's Expiring Offers, which lists Vendors, so it is under the
// Vendors' key, and a change to a Vendor asks it again. Their Offers are what
// it counts, so a change to any Offer asks it again too.
export const expiringOffersKey = [...vendorsKey, 'expiring-offers'] as const;

// Whether a query's key starts with another key.
function isUnder(queryKey: QueryKey, key: QueryKey): boolean {
  return key.every((part, index) => queryKey[index] === part);
}

// Asks again every query that a change to one of the Vendor's Offers, or
// confirming them all, changes: those about the Vendor's Offers, the
// Vendor's catalog search, and the Admin's two lists, as when the Admin acts
// as the Vendor. The queries about the Vendor's Offers may be asked again
// even when no screen shows them, so that the list a screen returns to is
// already fresh, and one of them may be left out, as a removed Offer's own
// query is.
export async function askAgainAfterAChangeToTheOffers(
  queryClient: QueryClient,
  vendorId: string,
  { refetchType, except }: { refetchType?: 'active' | 'all'; except?: QueryKey } = {},
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: vendorsOffersKey(vendorId),
      refetchType,
      predicate: ({ queryKey }) => except === undefined || !isUnder(queryKey, except),
    }),
    queryClient.invalidateQueries({ queryKey: vendorsCatalogSearchKey(vendorId) }),
    queryClient.invalidateQueries({ queryKey: missingSpecificationsKey }),
    queryClient.invalidateQueries({ queryKey: expiringOffersKey }),
  ]);
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

// The key of one of a Vendor's Offers, under the key of them all.
export function offerKey(vendorId: string, offerId: string) {
  return [...vendorsOffersKey(vendorId), 'offer', offerId] as const;
}

// One of a Vendor's Offers, with its Part, under the same key as the list, so
// that a change to it asks it again.
export function useOffer(vendorId: string, offerId: string) {
  return useQuery({
    queryKey: offerKey(vendorId, offerId),
    queryFn: () => dataOf(apiClient.readOffer({ path: { vendorId, offerId } })),
  });
}
