import { stopTestDatabase } from '@pcp/core/test-utils';

import { stopTestKeycloak } from './keycloak/test-keycloak';

export default async function globalTeardown(): Promise<void> {
  await Promise.all([stopTestDatabase(), stopTestKeycloak()]);
}
