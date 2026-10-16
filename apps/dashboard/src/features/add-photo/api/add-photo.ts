import { useMutation, useQueryClient } from '@tanstack/react-query';

import { partsKey } from '@/entities/part';
import { apiClient, dataOf } from '@/shared/api';

// Sends a photo for a Part, which replaces any it had. The Part, and every
// search, is then asked for again, so that the new photo's address is shown.
export function useAddPhoto(partId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photo: File) =>
      dataOf(apiClient.addPartPhoto({ path: { partId }, body: { photo } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partsKey }),
  });
}
