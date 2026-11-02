import type { PlatformRateResponse } from '@pcp/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, dataOf } from '@/shared/api';

// The Platform Rate's query has a key of its own, which no other query is
// under: nothing else the dashboard asks changes it.
export const platformRateKey = ['platform-rate'] as const;

// The current Platform Rate, or none until the Admin sets the first.
export function usePlatformRate() {
  return useQuery({
    queryKey: platformRateKey,
    queryFn: () => dataOf(apiClient.readPlatformRate()),
  });
}

// Sets the Platform Rate. The API answers the setting it added as the
// current rate, and the answer is written into the rate's query, so that the
// plate shows it at once, with the day it was set, without asking again.
export function useSetPlatformRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (iqdPerUsd: number) =>
      dataOf(apiClient.setPlatformRate({ body: { iqdPerUsd } })),
    onSuccess: (answer: PlatformRateResponse) => {
      queryClient.setQueryData(platformRateKey, answer);
    },
  });
}
