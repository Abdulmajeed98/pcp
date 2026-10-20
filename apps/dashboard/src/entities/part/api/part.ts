import { useQuery } from '@tanstack/react-query';

import { apiClient, dataOf, partsKey } from '@/shared/api';

// Every query about Parts is under this key, so that a change to any Part
// makes the next search and the next page ask the API again.
export { partsKey };

// Everything the platform holds about one Part, with its missing needed
// specifications listed.
export function usePart(partId: string) {
  return useQuery({
    queryKey: [...partsKey, partId],
    queryFn: () => dataOf(apiClient.readPart({ path: { partId } })),
  });
}
