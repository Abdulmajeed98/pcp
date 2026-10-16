import type { CategoryResponse } from '@pcp/api-client';
import { useQuery } from '@tanstack/react-query';

import { apiClient, dataOf } from '@/shared/api';
import { t } from '@/shared/i18n';

// A Category's key, such as `cpuCooler`, as the API and the shared terms
// name it.
export type CategoryKey = CategoryResponse['key'];

// The eight Categories, each with its specification list, as the API states
// them. The dashboard builds its Category choices, its forms and a Part's page
// from this answer, and holds no copy of its own. They change only with the
// API's code, so they are asked for once.
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => dataOf(apiClient.readCategories()),
    staleTime: Infinity,
  });
}

// A Category's name, from the shared terms, in the language the dashboard is
// shown in: English in the Admin console.
export function categoryName(key: CategoryKey): string {
  return t(`Category.${key}`);
}
