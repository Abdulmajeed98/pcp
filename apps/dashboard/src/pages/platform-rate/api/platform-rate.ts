import type { PlatformRateResponse, SetPlatformRateRequest } from '@pcp/api-client';
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
//
// An empty field is sent as null, for the API to refuse as `missing`. The
// generated client's type names only the rate the API takes, so the body is
// widened to it here, the one place a rate is sent.
export function useSetPlatformRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (iqdPerUsd: number | null) =>
      dataOf(apiClient.setPlatformRate({ body: { iqdPerUsd } as SetPlatformRateRequest })),
    onSuccess: (answer: PlatformRateResponse) => {
      queryClient.setQueryData(platformRateKey, answer);
    },
  });
}
