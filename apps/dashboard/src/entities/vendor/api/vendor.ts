import type { VendorResponse } from '@pcp/api-client';
import { useQuery } from '@tanstack/react-query';

import { apiClient, dataOf, Refusal, vendorsKey } from '@/shared/api';

// Every query about Vendors is under this key, so that a change to any Vendor
// makes the next page of the list and the next Vendor's page ask the API
// again.
export { vendorsKey };

// The key of the query about one Vendor.
export function vendorKey(vendorId: string) {
  return [...vendorsKey, vendorId] as const;
}

// Every detail the platform holds about one Vendor, and whether it is active.
export function useVendor(vendorId: string) {
  return useQuery({
    queryKey: vendorKey(vendorId),
    queryFn: () => dataOf(apiClient.readVendor({ path: { vendorId } })),
  });
}

// The key of the query about the Caller's own Vendor.
export const callersVendorKey = [...vendorsKey, 'caller'] as const;

// The Vendor whose Login the caller is, which the Vendor portal asks for when
// it starts. A Login with no Vendor behind it is refused with
// `VENDOR_NOT_FOUND`, and the Login of a deactivated Vendor with
// `VENDOR_DEACTIVATED`.
export function useCallersVendor() {
  return useQuery({
    queryKey: callersVendorKey,
    queryFn: () => dataOf(apiClient.readCallersVendor()),
  });
}

// Whether the API refused a call because the Caller's own Vendor is
// deactivated, which it says at every Vendor endpoint, whatever the token.
export function isRefusedAsDeactivated(error: unknown): boolean {
  return error instanceof Refusal && error.code === 'VENDOR_DEACTIVATED';
}

// A city's key, such as `erbil`, as the API and the shared terms name it.
export type CityKey = VendorResponse['city'];

// The cities a Vendor may be in, by their keys, as the API's fixed set holds
// them: Erbil alone.
export const cities: readonly CityKey[] = ['erbil'];
