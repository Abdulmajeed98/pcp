import { useMutation } from '@tanstack/react-query';

import { apiClient, dataOf } from '@/shared/api';

// Resets the password of a Vendor's Login: the API gives it a new temporary
// password, ends its sessions, and answers the password this once. Nothing
// the Admin console shows of the Vendor changes, so nothing is asked for
// again.
export function useResetPassword(vendorId: string) {
  return useMutation({
    mutationFn: () => dataOf(apiClient.resetVendorPassword({ path: { vendorId } })),
  });
}
