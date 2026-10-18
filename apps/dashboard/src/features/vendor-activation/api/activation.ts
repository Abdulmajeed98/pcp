import type { VendorResponse } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vendorKey, vendorsKey } from '@/entities/vendor';
import { apiClient, dataOf } from '@/shared/api';

// Deactivating or reactivating a Vendor, as the Admin. The Vendor's page
// draws the Vendor as the API answered it at once. Whether it succeeded or
// not, the list and the page ask the API again: a deactivation that failed
// halfway has already marked the Vendor.
function useActivationChange(
  vendorId: string,
  change: (vendorId: string) => Promise<VendorResponse>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => change(vendorId),
    onSuccess: (vendor) => queryClient.setQueryData(vendorKey(vendorId), vendor),
    onSettled: () => queryClient.invalidateQueries({ queryKey: vendorsKey }),
  });
}

export function useDeactivateVendor(vendorId: string) {
  return useActivationChange(vendorId, (id) =>
    dataOf(apiClient.deactivateVendor({ path: { vendorId: id } })),
  );
}

export function useReactivateVendor(vendorId: string) {
  return useActivationChange(vendorId, (id) =>
    dataOf(apiClient.reactivateVendor({ path: { vendorId: id } })),
  );
}
