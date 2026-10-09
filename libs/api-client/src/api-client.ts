import { createClient, createConfig } from './generated/client';
import * as operations from './generated/sdk.gen';

export type ApiClientOptions = {
  // Where the API is, for example `http://localhost:3001`.
  baseUrl: string;
  // Supplies the token of the login to call the API with. It is asked before
  // each request to an endpoint that needs a login, and for no other. An app
  // that has no login leaves it out.
  getToken?: () => Promise<string | undefined> | string | undefined;
};

type Operations = typeof operations;

// One function for each operation the API describes, named as the API names
// it. Each answers with `data` when the API answered, or with `error`, which
// is the API's error body, when it refused.
export type ApiClient = { [Name in keyof Operations]: Operations[Name] };

// Makes a client for the API at one address. The client is generated from the
// API's own description, so it knows nothing of how a login is made: it is
// handed a way to get a token.
export function createApiClient({ baseUrl, getToken }: ApiClientOptions): ApiClient {
  const client = createClient(createConfig({ baseUrl, auth: getToken }));

  const bound = Object.entries(operations).map(([name, operation]) => [
    name,
    (options?: object) =>
      (operation as (options: object) => unknown)({ client, ...options }),
  ]);

  return Object.fromEntries(bound) as ApiClient;
}
