import type { VendorResponse } from '@pcp/api-client';
import { useQuery } from '@tanstack/react-query';

import { apiClient, dataOf } from '@/shared/api';

// Every query about Vendors is under this key, so that a change to any Vendor
// makes the next page of the list and the next Vendor's page ask the API
// again.
export const vendorsKey = ['vendors'] as const;

// Every detail the platform holds about one Vendor, and whether it is active.
export function useVendor(vendorId: string) {
  return useQuery({
    queryKey: [...vendorsKey, vendorId],
    queryFn: () => dataOf(apiClient.readVendor({ path: { vendorId } })),
  });
}

// A city's key, such as `erbil`, as the API and the shared terms name it.
export type CityKey = VendorResponse['city'];
