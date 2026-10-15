import type { CallerResponse } from '@pcp/api-client';

import { apiClient } from '@/shared/api';

export type CallerAnswer =
  | { kind: 'caller'; caller: CallerResponse }
  | { kind: 'refused'; status: number; code: string }
  | { kind: 'unreachable' };

// Asks the API who the caller is. A refusal is an answer like any other: it
// is shown, and never answered by starting a login, so that an API that
// refuses every token cannot send the browser round Keycloak for ever.
export async function readCaller(): Promise<CallerAnswer> {
  const { data, error, response } = await apiClient.getCaller();
  if (data !== undefined) return { kind: 'caller', caller: data };

  // When the request cannot be made, the generated client answers without a
  // response, although its types say that there always is one. That is so
  // when the API cannot be reached, and when no token could be had for the
  // call because Keycloak could not be asked.
  const answered = response as Response | undefined;
  if (answered === undefined) return { kind: 'unreachable' };

  return {
    kind: 'refused',
    status: answered.status,
    code: error?.errors?.[0]?.code ?? 'UNKNOWN',
  };
}
