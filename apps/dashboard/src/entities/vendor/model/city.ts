import { t } from '@/shared/i18n';

import type { CityKey } from '../api/vendor';

// A city's name, from the shared terms, in the language the dashboard is
// shown in: English in the Admin console.
export function cityName(key: CityKey): string {
  return t(`City.${key}`);
}
