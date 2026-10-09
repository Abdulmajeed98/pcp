import type { StatusResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import { apiClient } from '@/shared/api';

// Reads the API's status while the page is rendered on the server. It answers
// with nothing when the API cannot be reached, or refuses. The client reports
// both as an answer without data, and never throws.
export async function readApiStatus(): Promise<StatusResponse | undefined> {
  // Rendering waits here for a request. The page is therefore never rendered
  // when the app is built, where no API is running.
  await connection();

  const { data } = await apiClient().getStatus();

  return data;
}
