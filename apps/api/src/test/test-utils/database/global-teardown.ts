import { stopTestDatabase } from '@pcp/core/test-utils';

export default async function globalTeardown(): Promise<void> {
  await stopTestDatabase();
}
